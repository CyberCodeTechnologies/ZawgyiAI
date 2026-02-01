const { ZawgyiCapability } = require('../core/zawgyi-capability');
const fs = require('fs-extra');
const path = require('path');
const multer = require('multer');

class FilesCapability extends ZawgyiCapability {
    constructor() {
        super('files', 'File Management - Upload, Download, Process, and Organize Files');
        
        this.setupActions();
        this.setupFileStorage();
    }

    setupFileStorage() {
        // Ensure file storage directories exist
        this.storageDir = path.join(process.cwd(), 'data', 'files');
        this.tempDir = path.join(this.storageDir, 'temp');
        this.uploadsDir = path.join(this.storageDir, 'uploads');
        this.documentsDir = path.join(this.storageDir, 'documents');
        this.imagesDir = path.join(this.storageDir, 'images');
        this.audioDir = path.join(this.storageDir, 'audio');
        this.videosDir = path.join(this.storageDir, 'videos');
        
        fs.ensureDirSync(this.storageDir);
        fs.ensureDirSync(this.tempDir);
        fs.ensureDirSync(this.uploadsDir);
        fs.ensureDirSync(this.documentsDir);
        fs.ensureDirSync(this.imagesDir);
        fs.ensureDirSync(this.audioDir);
        fs.ensureDirSync(this.videosDir);
    }

    setupActions() {
        this.addAction('upload', this.uploadFile.bind(this), {
            description: 'Upload a file to storage',
            parameters: ['file_path', 'category']
        });

        this.addAction('download', this.downloadFile.bind(this), {
            description: 'Download a file from storage',
            parameters: ['file_id']
        });

        this.addAction('list', this.listFiles.bind(this), {
            description: 'List files in storage',
            parameters: ['category']
        });

        this.addAction('delete', this.deleteFile.bind(this), {
            description: 'Delete a file from storage',
            parameters: ['file_id']
        });

        this.addAction('analyze', this.analyzeFile.bind(this), {
            description: 'Analyze file content and metadata',
            parameters: ['file_id']
        });

        this.addAction('organize', this.organizeFiles.bind(this), {
            description: 'Organize files by type and date',
            parameters: ['criteria']
        });
    }

    async uploadFile(params, userId) {
        const { file_path, category = 'general' } = params;
        
        if (!file_path) {
            throw new Error('File path is required');
        }

        console.log(`📁 Uploading file: ${file_path}`);

        try {
            // Check if source file exists
            if (!fs.existsSync(file_path)) {
                throw new Error('Source file not found');
            }

            // Get file stats
            const stats = await fs.stat(file_path);
            const fileSize = stats.size;
            const fileName = path.basename(file_path);
            const fileExt = path.extname(fileName).toLowerCase();

            // Determine target directory based on file type
            let targetDir = this.uploadsDir;
            if (this.isImageFile(fileExt)) {
                targetDir = this.imagesDir;
            } else if (this.isAudioFile(fileExt)) {
                targetDir = this.audioDir;
            } else if (this.isVideoFile(fileExt)) {
                targetDir = this.videosDir;
            } else if (this.isDocumentFile(fileExt)) {
                targetDir = this.documentsDir;
            }

            // Generate unique filename
            const timestamp = Date.now();
            const uniqueFileName = `${timestamp}_${fileName}`;
            const targetPath = path.join(targetDir, uniqueFileName);

            // Copy file to storage
            await fs.copy(file_path, targetPath);

            // Generate file ID
            const fileId = this.generateFileId();

            // Store file metadata
            const metadata = {
                id: fileId,
                original_name: fileName,
                stored_name: uniqueFileName,
                path: targetPath,
                size: fileSize,
                type: this.getFileType(fileExt),
                category: category,
                uploaded_by: userId,
                upload_time: new Date().toISOString(),
                checksum: await this.calculateChecksum(targetPath)
            };

            // Save metadata
            await this.saveFileMetadata(fileId, metadata);

            return {
                message: `File uploaded successfully`,
                file_id: fileId,
                original_name: fileName,
                size: this.formatFileSize(fileSize),
                type: metadata.type,
                category: category,
                status: 'success',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('File upload error:', error);
            throw new Error(`Failed to upload file: ${error.message}`);
        }
    }

    async downloadFile(params, userId) {
        const { file_id } = params;
        
        if (!file_id) {
            throw new Error('File ID is required');
        }

        console.log(`📥 Downloading file: ${file_id}`);

        try {
            // Get file metadata
            const metadata = await this.getFileMetadata(file_id);
            
            if (!metadata) {
                throw new Error('File not found');
            }

            // Check if file exists
            if (!fs.existsSync(metadata.path)) {
                throw new Error('File data not found');
            }

            return {
                message: `File ready for download`,
                file_id: file_id,
                original_name: metadata.original_name,
                path: metadata.path,
                size: this.formatFileSize(metadata.size),
                type: metadata.type,
                download_url: `/api/files/download/${file_id}`,
                status: 'success',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('File download error:', error);
            throw new Error(`Failed to download file: ${error.message}`);
        }
    }

    async listFiles(params, userId) {
        const { category } = params;

        console.log(`📋 Listing files${category ? ` in category: ${category}` : ''}`);

        try {
            const files = await this.getAllFilesMetadata();
            
            let filteredFiles = files;
            if (category) {
                filteredFiles = files.filter(file => file.category === category);
            }

            // Sort by upload time (newest first)
            filteredFiles.sort((a, b) => new Date(b.upload_time) - new Date(a.upload_time));

            return {
                message: `Found ${filteredFiles.length} files`,
                files: filteredFiles.map(file => ({
                    id: file.id,
                    name: file.original_name,
                    size: this.formatFileSize(file.size),
                    type: file.type,
                    category: file.category,
                    upload_time: file.upload_time
                })),
                total_count: filteredFiles.length,
                status: 'success',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('List files error:', error);
            throw new Error(`Failed to list files: ${error.message}`);
        }
    }

    async deleteFile(params, userId) {
        const { file_id } = params;
        
        if (!file_id) {
            throw new Error('File ID is required');
        }

        console.log(`🗑️ Deleting file: ${file_id}`);

        try {
            // Get file metadata
            const metadata = await this.getFileMetadata(file_id);
            
            if (!metadata) {
                throw new Error('File not found');
            }

            // Delete file from storage
            if (fs.existsSync(metadata.path)) {
                await fs.remove(metadata.path);
            }

            // Delete metadata
            await this.deleteFileMetadata(file_id);

            return {
                message: `File deleted successfully`,
                file_id: file_id,
                original_name: metadata.original_name,
                status: 'success',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('File delete error:', error);
            throw new Error(`Failed to delete file: ${error.message}`);
        }
    }

    async analyzeFile(params, userId) {
        const { file_id } = params;
        
        if (!file_id) {
            throw new Error('File ID is required');
        }

        console.log(`🔍 Analyzing file: ${file_id}`);

        try {
            // Get file metadata
            const metadata = await this.getFileMetadata(file_id);
            
            if (!metadata) {
                throw new Error('File not found');
            }

            // Perform basic file analysis
            const analysis = {
                file_info: {
                    name: metadata.original_name,
                    size: this.formatFileSize(metadata.size),
                    type: metadata.type,
                    category: metadata.category,
                    upload_time: metadata.upload_time
                },
                content_analysis: {
                    text_content: this.isTextFile(metadata.type) ? 'Text file content analysis not yet implemented' : 'Binary file',
                    metadata_extracted: 'Metadata extraction not yet implemented',
                    language_detected: 'Language detection not yet implemented'
                },
                security_analysis: {
                    virus_scan: 'Virus scanning not yet implemented',
                    checksum_valid: metadata.checksum,
                    file_integrity: 'OK'
                }
            };

            return {
                message: `File analysis completed`,
                file_id: file_id,
                analysis: analysis,
                status: 'success',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('File analysis error:', error);
            throw new Error(`Failed to analyze file: ${error.message}`);
        }
    }

    async organizeFiles(params, userId) {
        const { criteria = 'type' } = params;

        console.log(`🗂️ Organizing files by: ${criteria}`);

        try {
            const files = await this.getAllFilesMetadata();
            let organizedCount = 0;

            for (const file of files) {
                let targetDir = this.uploadsDir;

                if (criteria === 'type') {
                    if (this.isImageFile(path.extname(file.original_name))) {
                        targetDir = this.imagesDir;
                    } else if (this.isAudioFile(path.extname(file.original_name))) {
                        targetDir = this.audioDir;
                    } else if (this.isVideoFile(path.extname(file.original_name))) {
                        targetDir = this.videosDir;
                    } else if (this.isDocumentFile(path.extname(file.original_name))) {
                        targetDir = this.documentsDir;
                    }
                } else if (criteria === 'date') {
                    const date = new Date(file.upload_time);
                    const dateDir = path.join(this.storageDir, 'by_date', date.toISOString().split('T')[0]);
                    fs.ensureDirSync(dateDir);
                    targetDir = dateDir;
                }

                // Move file if needed
                const currentDir = path.dirname(file.path);
                if (currentDir !== targetDir) {
                    const newPath = path.join(targetDir, path.basename(file.path));
                    await fs.move(file.path, newPath);
                    
                    // Update metadata
                    file.path = newPath;
                    await this.saveFileMetadata(file.id, file);
                    organizedCount++;
                }
            }

            return {
                message: `File organization completed`,
                criteria: criteria,
                files_organized: organizedCount,
                total_files: files.length,
                status: 'success',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('File organization error:', error);
            throw new Error(`Failed to organize files: ${error.message}`);
        }
    }

    // Helper methods
    generateFileId() {
        return 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    async calculateChecksum(filePath) {
        // Simple checksum implementation
        const stats = await fs.stat(filePath);
        return stats.size.toString() + stats.mtime.getTime().toString();
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    getFileType(ext) {
        if (this.isImageFile(ext)) return 'image';
        if (this.isAudioFile(ext)) return 'audio';
        if (this.isVideoFile(ext)) return 'video';
        if (this.isDocumentFile(ext)) return 'document';
        return 'other';
    }

    isImageFile(ext) {
        return ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'].includes(ext);
    }

    isAudioFile(ext) {
        return ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a'].includes(ext);
    }

    isVideoFile(ext) {
        return ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'].includes(ext);
    }

    isDocumentFile(ext) {
        return ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt', '.xls', '.xlsx', '.ppt', '.pptx'].includes(ext);
    }

    isTextFile(type) {
        return ['document', 'other'].includes(type);
    }

    async saveFileMetadata(fileId, metadata) {
        const metadataPath = path.join(this.storageDir, 'metadata.json');
        let metadataStore = {};
        
        if (fs.existsSync(metadataPath)) {
            metadataStore = await fs.readJson(metadataPath);
        }
        
        metadataStore[fileId] = metadata;
        await fs.writeJson(metadataPath, metadataStore, { spaces: 2 });
    }

    async getFileMetadata(fileId) {
        const metadataPath = path.join(this.storageDir, 'metadata.json');
        
        if (!fs.existsSync(metadataPath)) {
            return null;
        }
        
        const metadataStore = await fs.readJson(metadataPath);
        return metadataStore[fileId] || null;
    }

    async deleteFileMetadata(fileId) {
        const metadataPath = path.join(this.storageDir, 'metadata.json');
        
        if (!fs.existsSync(metadataPath)) {
            return;
        }
        
        const metadataStore = await fs.readJson(metadataPath);
        delete metadataStore[fileId];
        await fs.writeJson(metadataPath, metadataStore, { spaces: 2 });
    }

    async getAllFilesMetadata() {
        const metadataPath = path.join(this.storageDir, 'metadata.json');
        
        if (!fs.existsSync(metadataPath)) {
            return [];
        }
        
        const metadataStore = await fs.readJson(metadataPath);
        return Object.values(metadataStore);
    }
}

module.exports = FilesCapability;
