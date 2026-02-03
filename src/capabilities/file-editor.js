const { ZawgyiCapability } = require('../core/zawgyi-capability');
const fs = require('fs-extra');
const path = require('path');

class FileEditorCapability extends ZawgyiCapability {
    constructor(gateway = null) {
        super('file-editor', 'AI Code Editor for file system access and editing');
        this.gateway = gateway;
        this.basePath = path.join(process.cwd()); // Default to current directory
        this.currentPath = this.basePath;
        this.setupActions();
    }

    setupActions() {
        this.addAction('list_files', this.listFiles.bind(this), {
            description: 'List files and folders in current directory',
            parameters: ['path']
        });

        this.addAction('change_directory', this.changeDirectory.bind(this), {
            description: 'Change to a different directory',
            parameters: ['path']
        });

        this.addAction('read_file', this.readFile.bind(this), {
            description: 'Read the contents of a file',
            parameters: ['filename']
        });

        this.addAction('write_file', this.writeFile.bind(this), {
            description: 'Write content to a file',
            parameters: ['filename', 'content']
        });

        this.addAction('create_file', this.createFile.bind(this), {
            description: 'Create a new file',
            parameters: ['filename']
        });

        this.addAction('delete_file', this.deleteFile.bind(this), {
            description: 'Delete a file',
            parameters: ['filename']
        });

        this.addAction('create_folder', this.createFolder.bind(this), {
            description: 'Create a new folder',
            parameters: ['foldername']
        });

        this.addAction('get_current_path', this.getCurrentPath.bind(this), {
            description: 'Get current working directory'
        });
    }

    async listFiles(params, userId) {
        try {
            const targetPath = params.path || this.currentPath;
            const fullPath = path.isAbsolute(targetPath) ? targetPath : path.join(this.currentPath, targetPath);
            
            if (!fs.existsSync(fullPath)) {
                return {
                    success: false,
                    message: `Path does not exist: ${fullPath}`
                };
            }

            const items = await fs.readdir(fullPath);
            const fileList = [];
            const folderList = [];

            for (const item of items) {
                const itemPath = path.join(fullPath, item);
                const stats = await fs.stat(itemPath);
                
                if (stats.isDirectory()) {
                    folderList.push({
                        name: item,
                        type: 'folder',
                        path: path.relative(this.basePath, itemPath)
                    });
                } else {
                    const content = await fs.readFile(itemPath, 'utf8');
                    fileList.push({
                        name: item,
                        type: 'file',
                        size: stats.size,
                        modified: stats.mtime.toISOString(),
                        path: path.relative(this.basePath, itemPath),
                        preview: content.length > 100 ? content.substring(0, 100) + '...' : content
                    });
                }
            }

            const relativePath = path.relative(this.basePath, fullPath);
            const response = `📁 *Directory: ${relativePath || '/'}*\n\n` +
                `📂 **Folders (${folderList.length}):**\n` +
                folderList.map((folder, index) => `${index + 1}. 📁 ${folder.name}`).join('\n') +
                `\n\n📄 **Files (${fileList.length}):**\n` +
                fileList.map((file, index) => `${index + 1}. 📄 ${file.name} (${file.size} bytes)`).join('\n');

            return {
                success: true,
                message: response,
                data: {
                    currentPath: relativePath,
                    folders: folderList,
                    files: fileList
                }
            };

        } catch (error) {
            return {
                success: false,
                message: `Error listing files: ${error.message}`
            };
        }
    }

    async changeDirectory(params, userId) {
        try {
            const targetPath = params.path;
            const fullPath = path.isAbsolute(targetPath) ? targetPath : path.join(this.currentPath, targetPath);
            
            if (!fs.existsSync(fullPath)) {
                return {
                    success: false,
                    message: `Directory does not exist: ${fullPath}`
                };
            }

            const stats = await fs.stat(fullPath);
            if (!stats.isDirectory()) {
                return {
                    success: false,
                    message: `Path is not a directory: ${fullPath}`
                };
            }

            this.currentPath = fullPath;
            const relativePath = path.relative(this.basePath, fullPath);
            
            return {
                success: true,
                message: `✅ Changed to directory: ${relativePath || '/'}`,
                currentPath: relativePath
            };

        } catch (error) {
            return {
                success: false,
                message: `Error changing directory: ${error.message}`
            };
        }
    }

    async readFile(params, userId) {
        try {
            const filename = params.filename;
            const fullPath = path.isAbsolute(filename) ? filename : path.join(this.currentPath, filename);
            
            if (!fs.existsSync(fullPath)) {
                return {
                    success: false,
                    message: `File does not exist: ${filename}`
                };
            }

            const stats = await fs.stat(fullPath);
            if (stats.isDirectory()) {
                return {
                    success: false,
                    message: `Path is a directory, not a file: ${filename}`
                };
            }

            const content = await fs.readFile(fullPath, 'utf8');
            const relativePath = path.relative(this.basePath, fullPath);
            
            // Truncate content if too long for Telegram
            const maxContentLength = 3000;
            const truncatedContent = content.length > maxContentLength ? 
                content.substring(0, maxContentLength) + '\n\n... (content truncated)' : content;

            const response = `📄 *File: ${relativePath}*\n` +
                `📊 Size: ${stats.size} bytes | Modified: ${stats.mtime.toLocaleString()}\n\n` +
                '```\n' + truncatedContent + '\n```';

            return {
                success: true,
                message: response,
                data: {
                    filename: relativePath,
                    content: content,
                    size: stats.size,
                    truncated: content.length > maxContentLength
                }
            };

        } catch (error) {
            return {
                success: false,
                message: `Error reading file: ${error.message}`
            };
        }
    }

    async writeFile(params, userId) {
        try {
            const { filename, content } = params;
            const fullPath = path.isAbsolute(filename) ? filename : path.join(this.currentPath, filename);
            
            // Create directory if it doesn't exist
            const dir = path.dirname(fullPath);
            await fs.ensureDir(dir);
            
            await fs.writeFile(fullPath, content, 'utf8');
            const relativePath = path.relative(this.basePath, fullPath);
            
            return {
                success: true,
                message: `✅ File saved: ${relativePath}`,
                path: relativePath
            };

        } catch (error) {
            return {
                success: false,
                message: `Error writing file: ${error.message}`
            };
        }
    }

    async createFile(params, userId) {
        try {
            const filename = params.filename;
            const fullPath = path.isAbsolute(filename) ? filename : path.join(this.currentPath, filename);
            
            if (fs.existsSync(fullPath)) {
                return {
                    success: false,
                    message: `File already exists: ${filename}`
                };
            }

            // Create directory if it doesn't exist
            const dir = path.dirname(fullPath);
            await fs.ensureDir(dir);
            
            await fs.writeFile(fullPath, '', 'utf8');
            const relativePath = path.relative(this.basePath, fullPath);
            
            return {
                success: true,
                message: `✅ File created: ${relativePath}`,
                path: relativePath
            };

        } catch (error) {
            return {
                success: false,
                message: `Error creating file: ${error.message}`
            };
        }
    }

    async deleteFile(params, userId) {
        try {
            const filename = params.filename;
            const fullPath = path.isAbsolute(filename) ? filename : path.join(this.currentPath, filename);
            
            if (!fs.existsSync(fullPath)) {
                return {
                    success: false,
                    message: `File does not exist: ${filename}`
                };
            }

            const stats = await fs.stat(fullPath);
            if (stats.isDirectory()) {
                await fs.remove(fullPath);
                const relativePath = path.relative(this.basePath, fullPath);
                return {
                    success: true,
                    message: `✅ Folder deleted: ${relativePath}`,
                    path: relativePath
                };
            } else {
                await fs.remove(fullPath);
                const relativePath = path.relative(this.basePath, fullPath);
                return {
                    success: true,
                    message: `✅ File deleted: ${relativePath}`,
                    path: relativePath
                };
            }

        } catch (error) {
            return {
                success: false,
                message: `Error deleting file: ${error.message}`
            };
        }
    }

    async createFolder(params, userId) {
        try {
            const foldername = params.foldername;
            const fullPath = path.isAbsolute(foldername) ? foldername : path.join(this.currentPath, foldername);
            
            if (fs.existsSync(fullPath)) {
                return {
                    success: false,
                    message: `Folder already exists: ${foldername}`
                };
            }

            await fs.mkdir(fullPath, { recursive: true });
            const relativePath = path.relative(this.basePath, fullPath);
            
            return {
                success: true,
                message: `✅ Folder created: ${relativePath}`,
                path: relativePath
            };

        } catch (error) {
            return {
                success: false,
                message: `Error creating folder: ${error.message}`
            };
        }
    }

    async getCurrentPath(params, userId) {
        try {
            const relativePath = path.relative(this.basePath, this.currentPath);
            return {
                success: true,
                message: `📍 Current directory: ${relativePath || '/'}`,
                currentPath: relativePath,
                fullPath: this.currentPath
            };
        } catch (error) {
            return {
                success: false,
                message: `Error getting current path: ${error.message}`
            };
        }
    }
}

module.exports = FileEditorCapability;
