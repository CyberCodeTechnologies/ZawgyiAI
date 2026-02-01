const { ZawgyiCapability } = require('../core/zawgyi-capability');
const fs = require('fs-extra');
const path = require('path');

class ProductivityPlanningCapability extends ZawgyiCapability {
    constructor() {
        super('productivity-planning', 'Productivity & Planning - Time Blocking, Task Scoring, Calendar Management, and Daily Briefs');
        
        this.setupActions();
        this.setupPlanningStorage();
    }

    setupActions() {
        this.addAction('timeblock_tasks', this.timeblockTasks.bind(this), {
            description: 'Time-block tasks in calendar based on importance',
            parameters: ['tasks', 'date', 'priorities']
        });

        this.addAction('score_tasks', this.scoreTasks.bind(this), {
            description: 'Score tasks by urgency and priority',
            parameters: ['tasks', 'criteria']
        });

        this.addAction('manage_calendar', this.manageCalendar.bind(this), {
            description: 'Manage calendars autonomously and resolve conflicts',
            parameters: ['actions', 'conflict_resolution']
        });

        this.addAction('weekly_review', this.weeklyReview.bind(this), {
            description: 'Lead weekly reviews using meeting notes and transcripts',
            parameters: ['week_data', 'focus_areas']
        });

        this.addAction('daily_brief', this.dailyBrief.bind(this), {
            description: 'Generate daily briefs (weather, agenda, reminders, reading suggestions)',
            parameters: ['date', 'preferences']
        });

        this.addAction('track_expenses', this.trackExpenses.bind(this), {
            description: 'Track costs and split expenses after trips',
            parameters: ['expenses', 'trip_id', 'split_method']
        });

        this.addAction('create_invoice', this.createInvoice.bind(this), {
            description: 'Create invoices and work summaries',
            parameters: ['client', 'work_items', 'rates']
        });

        this.addAction('meal_plan', this.mealPlan.bind(this), {
            description: 'Manage meal planning, shopping lists, and family schedules',
            parameters: ['preferences', 'family_members', 'duration']
        });
    }

    setupPlanningStorage() {
        this.planningPath = path.join(process.cwd(), 'data', 'productivity-planning');
        this.calendarPath = path.join(this.planningPath, 'calendar');
        this.tasksPath = path.join(this.planningPath, 'tasks');
        this.expensesPath = path.join(this.planningPath, 'expenses');
        this.mealsPath = path.join(this.planningPath, 'meals');
        
        fs.ensureDirSync(this.planningPath);
        fs.ensureDirSync(this.calendarPath);
        fs.ensureDirSync(this.tasksPath);
        fs.ensureDirSync(this.expensesPath);
        fs.ensureDirSync(this.mealsPath);
    }

    async timeblockTasks(params, userId) {
        const { tasks, date = new Date().toISOString().split('T')[0], priorities = {} } = params;
        
        if (!tasks || !Array.isArray(tasks)) {
            throw new Error('Tasks array is required');
        }

        console.log(`📅 Time-blocking ${tasks.length} tasks for ${date}`);

        try {
            // Score tasks first
            const scoredTasks = await this.scoreTasks({ tasks, criteria: priorities }, userId);
            
            // Sort by score (highest first)
            scoredTasks.scored_tasks.sort((a, b) => b.score - a.score);
            
            // Create time blocks
            const timeBlocks = [];
            const workHours = { start: 9, end: 17 }; // 9 AM to 5 PM
            let currentTime = { hour: workHours.start, minute: 0 };
            
            for (const task of scoredTasks.scored_tasks) {
                const duration = task.estimated_duration || 60; // minutes
                const endTime = this.addMinutes(currentTime, duration);
                
                // Check if within work hours
                if (endTime.hour < workHours.end || (endTime.hour === workHours.end && endTime.minute === 0)) {
                    timeBlocks.push({
                        task: task.name,
                        start_time: `${String(currentTime.hour).padStart(2, '0')}:${String(currentTime.minute).padStart(2, '0')}`,
                        end_time: `${String(endTime.hour).padStart(2, '0')}:${String(endTime.minute).padStart(2, '0')}`,
                        duration: duration,
                        priority: task.priority,
                        score: task.score
                    });
                    
                    currentTime = endTime;
                    
                    // Add 15-minute break between tasks
                    if (currentTime.hour < workHours.end) {
                        currentTime = this.addMinutes(currentTime, 15);
                    }
                }
            }

            // Save time blocks
            await this.saveTimeBlocks(date, timeBlocks);

            return {
                message: `Time-blocking completed for ${date}`,
                date: date,
                total_tasks: tasks.length,
                scheduled_tasks: timeBlocks.length,
                time_blocks: timeBlocks,
                status: 'success',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Time-blocking error:', error);
            throw new Error(`Failed to time-block tasks: ${error.message}`);
        }
    }

    async scoreTasks(params, userId) {
        const { tasks, criteria = {} } = params;
        
        if (!tasks || !Array.isArray(tasks)) {
            throw new Error('Tasks array is required');
        }

        console.log(`🎯 Scoring ${tasks.length} tasks`);

        try {
            const scoredTasks = tasks.map(task => {
                let score = 0;
                let factors = {};

                // Urgency scoring (0-30 points)
                if (task.urgency) {
                    factors.urgency = this.mapUrgency(task.urgency);
                    score += factors.urgency;
                }

                // Priority scoring (0-25 points)
                if (task.priority) {
                    factors.priority = this.mapPriority(task.priority);
                    score += factors.priority;
                }

                // Deadline scoring (0-20 points)
                if (task.deadline) {
                    factors.deadline = this.calculateDeadlineScore(task.deadline);
                    score += factors.deadline;
                }

                // Value scoring (0-15 points)
                if (task.value) {
                    factors.value = this.mapValue(task.value);
                    score += factors.value;
                }

                // Effort scoring (0-10 points, lower effort = higher score)
                if (task.effort) {
                    factors.effort = this.mapEffort(task.effort);
                    score += factors.effort;
                }

                return {
                    ...task,
                    score: score,
                    scoring_factors: factors,
                    recommended_action: this.getRecommendedAction(score)
                };
            });

            return {
                message: 'Task scoring completed',
                scored_tasks: scoredTasks,
                scoring_summary: {
                    total_tasks: tasks.length,
                    high_priority: scoredTasks.filter(t => t.score >= 70).length,
                    medium_priority: scoredTasks.filter(t => t.score >= 40 && t.score < 70).length,
                    low_priority: scoredTasks.filter(t => t.score < 40).length
                },
                status: 'success',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Task scoring error:', error);
            throw new Error(`Failed to score tasks: ${error.message}`);
        }
    }

    async manageCalendar(params, userId) {
        const { actions = [], conflict_resolution = 'auto' } = params;
        
        console.log(`📆 Managing calendar with ${actions.length} actions`);

        try {
            const results = [];
            
            for (const action of actions) {
                const result = await this.processCalendarAction(action, conflict_resolution);
                results.push(result);
            }

            // Check for conflicts
            const conflicts = await this.detectCalendarConflicts();
            const resolvedConflicts = [];

            for (const conflict of conflicts) {
                const resolution = await this.resolveConflict(conflict, conflict_resolution);
                resolvedConflicts.push(resolution);
            }

            return {
                message: 'Calendar management completed',
                actions_processed: results.length,
                conflicts_detected: conflicts.length,
                conflicts_resolved: resolvedConflicts.length,
                results: results,
                conflicts: resolvedConflicts,
                status: 'success',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Calendar management error:', error);
            throw new Error(`Failed to manage calendar: ${error.message}`);
        }
    }

    async weeklyReview(params, userId) {
        const { week_data, focus_areas = [] } = params;
        
        console.log(`📊 Conducting weekly review`);

        try {
            const review = {
                week_start: week_data?.week_start || this.getWeekStart(),
                week_end: week_data?.week_end || this.getWeekEnd(),
                focus_areas: focus_areas,
                accomplishments: await this.getWeeklyAccomplishments(),
                challenges: await this.getWeeklyChallenges(),
                metrics: await this.getWeeklyMetrics(),
                next_week_priorities: await this.generateNextWeekPriorities(),
                insights: await this.generateWeeklyInsights(),
                action_items: await this.generateWeeklyActionItems()
            };

            // Save review
            await this.saveWeeklyReview(review);

            return {
                message: 'Weekly review completed',
                review: review,
                status: 'success',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Weekly review error:', error);
            throw new Error(`Failed to conduct weekly review: ${error.message}`);
        }
    }

    async dailyBrief(params, userId) {
        const { date = new Date().toISOString().split('T')[0], preferences = {} } = params;
        
        console.log(`📰 Generating daily brief for ${date}`);

        try {
            const brief = {
                date: date,
                weather: await this.getWeatherForecast(),
                agenda: await this.getDailyAgenda(date),
                reminders: await this.getDailyReminders(date),
                reading_suggestions: await this.getReadingSuggestions(preferences),
                priorities: await this.getDailyPriorities(date),
                motivational_quote: await this.getMotivationalQuote(),
                health_reminders: await this.getHealthReminders(),
                status: 'success'
            };

            return {
                message: `Daily brief generated for ${date}`,
                brief: brief,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Daily brief error:', error);
            throw new Error(`Failed to generate daily brief: ${error.message}`);
        }
    }

    async trackExpenses(params, userId) {
        const { expenses, trip_id, split_method = 'equal' } = params;
        
        if (!expenses || !Array.isArray(expenses)) {
            throw new Error('Expenses array is required');
        }

        console.log(`💰 Tracking ${expenses.length} expenses for trip ${trip_id}`);

        try {
            const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
            const splits = this.calculateExpenseSplits(expenses, split_method);
            
            const expenseTracker = {
                trip_id: trip_id,
                total_expenses: totalExpenses,
                expenses: expenses,
                splits: splits,
                split_method: split_method,
                created_at: new Date().toISOString(),
                created_by: userId
            };

            // Save expense tracker
            await this.saveExpenseTracker(expenseTracker);

            return {
                message: 'Expense tracking completed',
                trip_id: trip_id,
                total_expenses: totalExpenses,
                expenses_count: expenses.length,
                splits: splits,
                status: 'success',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Expense tracking error:', error);
            throw new Error(`Failed to track expenses: ${error.message}`);
        }
    }

    async createInvoice(params, userId) {
        const { client, work_items, rates = {} } = params;
        
        if (!client || !work_items) {
            throw new Error('Client and work items are required');
        }

        console.log(`🧾 Creating invoice for ${client}`);

        try {
            const invoice = {
                id: 'inv_' + Date.now(),
                client: client,
                work_items: work_items,
                rates: rates,
                line_items: this.generateInvoiceLineItems(work_items, rates),
                subtotal: 0,
                tax: 0,
                total: 0,
                created_at: new Date().toISOString(),
                created_by: userId,
                status: 'draft',
                due_date: this.calculateDueDate()
            };

            // Calculate totals
            invoice.subtotal = invoice.line_items.reduce((sum, item) => sum + item.amount, 0);
            invoice.tax = invoice.subtotal * 0.1; // 10% tax
            invoice.total = invoice.subtotal + invoice.tax;

            // Save invoice
            await this.saveInvoice(invoice);

            return {
                message: `Invoice created for ${client}`,
                invoice: invoice,
                status: 'success',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Invoice creation error:', error);
            throw new Error(`Failed to create invoice: ${error.message}`);
        }
    }

    async mealPlan(params, userId) {
        const { preferences, family_members = [], duration = 7 } = params;
        
        console.log(`🍽️ Creating meal plan for ${duration} days`);

        try {
            const mealPlan = {
                duration: duration,
                family_members: family_members,
                preferences: preferences,
                meals: await this.generateMealPlan(preferences, family_members, duration),
                shopping_list: await this.generateShoppingList(preferences, duration),
                family_schedule: await this.generateFamilySchedule(family_members, duration),
                created_at: new Date().toISOString(),
                created_by: userId
            };

            // Save meal plan
            await this.saveMealPlan(mealPlan);

            return {
                message: `Meal plan created for ${duration} days`,
                meal_plan: mealPlan,
                status: 'success',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Meal planning error:', error);
            throw new Error(`Failed to create meal plan: ${error.message}`);
        }
    }

    // Helper methods
    addMinutes(time, minutes) {
        const totalMinutes = time.hour * 60 + time.minute + minutes;
        return {
            hour: Math.floor(totalMinutes / 60),
            minute: totalMinutes % 60
        };
    }

    mapUrgency(urgency) {
        const mapping = { 'critical': 30, 'high': 25, 'medium': 15, 'low': 5 };
        return mapping[urgency.toLowerCase()] || 10;
    }

    mapPriority(priority) {
        const mapping = { 'p1': 25, 'p2': 20, 'p3': 15, 'p4': 10, 'p5': 5 };
        return mapping[priority.toLowerCase()] || 15;
    }

    calculateDeadlineScore(deadline) {
        const daysUntilDeadline = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
        if (daysUntilDeadline <= 0) return 20;
        if (daysUntilDeadline <= 1) return 18;
        if (daysUntilDeadline <= 3) return 15;
        if (daysUntilDeadline <= 7) return 10;
        return 5;
    }

    mapValue(value) {
        const mapping = { 'high': 15, 'medium': 10, 'low': 5 };
        return mapping[value.toLowerCase()] || 8;
    }

    mapEffort(effort) {
        const mapping = { 'low': 10, 'medium': 6, 'high': 3, 'very-high': 0 };
        return mapping[effort.toLowerCase()] || 5;
    }

    getRecommendedAction(score) {
        if (score >= 70) return 'Do Today';
        if (score >= 40) return 'Schedule This Week';
        return 'Consider for Later';
    }

    async saveTimeBlocks(date, timeBlocks) {
        const filePath = path.join(this.calendarPath, `${date}.json`);
        await fs.writeJson(filePath, { date, time_blocks: timeBlocks }, { spaces: 2 });
    }

    async processCalendarAction(action, conflictResolution) {
        // Simulate calendar action processing
        return {
            action: action.type,
            status: 'completed',
            result: `Calendar ${action.type} processed successfully`
        };
    }

    async detectCalendarConflicts() {
        // Simulate conflict detection
        return [
            {
                type: 'overlap',
                events: ['Meeting A', 'Meeting B'],
                time: '2024-01-15 14:00-15:00'
            }
        ];
    }

    async resolveConflict(conflict, resolutionMethod) {
        // Simulate conflict resolution
        return {
            conflict: conflict,
            resolution: resolutionMethod,
            status: 'resolved'
        };
    }

    async getWeeklyAccomplishments() {
        return [
            'Completed project proposal',
            'Fixed 5 critical bugs',
            'Attended 3 client meetings'
        ];
    }

    async getWeeklyChallenges() {
        return [
            'Resource constraints on Project X',
            'Deadline pressure for deliverables'
        ];
    }

    async getWeeklyMetrics() {
        return {
            tasks_completed: 23,
            hours_worked: 42,
            meetings_attended: 8,
            productivity_score: 85
        };
    }

    async generateNextWeekPriorities() {
        return [
            'Complete project milestone',
            'Review team performance',
            'Prepare client presentation'
        ];
    }

    async generateWeeklyInsights() {
        return [
            'Productivity increased by 15%',
            'Meeting efficiency needs improvement',
            'Task completion rate above target'
        ];
    }

    async generateWeeklyActionItems() {
        return [
            'Schedule follow-up with client',
            'Update project timeline',
            'Review team workload'
        ];
    }

    async saveWeeklyReview(review) {
        const filePath = path.join(this.planningPath, `weekly-review-${review.week_start}.json`);
        await fs.writeJson(filePath, review, { spaces: 2 });
    }

    getWeekStart() {
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        return startOfWeek.toISOString().split('T')[0];
    }

    getWeekEnd() {
        const now = new Date();
        const endOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6));
        return endOfWeek.toISOString().split('T')[0];
    }

    async getWeatherForecast() {
        return {
            condition: 'Partly Cloudy',
            temperature: '72°F',
            humidity: '65%',
            precipitation: '10%'
        };
    }

    async getDailyAgenda(date) {
        return [
            { time: '09:00', event: 'Team standup' },
            { time: '10:30', event: 'Client call' },
            { time: '14:00', event: 'Project review' }
        ];
    }

    async getDailyReminders(date) {
        return [
            'Submit expense report',
            'Call dentist for appointment',
            'Review weekly goals'
        ];
    }

    async getReadingSuggestions(preferences) {
        return [
            { title: 'AI Trends 2024', type: 'article', duration: '5 min' },
            { title: 'Leadership Principles', type: 'book', duration: '20 min' }
        ];
    }

    async getDailyPriorities(date) {
        return [
            'Complete project proposal',
            'Review team feedback',
            'Prepare for client meeting'
        ];
    }

    async getMotivationalQuote() {
        return '"Success is not final, failure is not fatal: it is the courage to continue that counts." - Winston Churchill';
    }

    async getHealthReminders() {
        return [
            'Take vitamins',
            'Drink 8 glasses of water',
            '30-minute walk scheduled'
        ];
    }

    calculateExpenseSplits(expenses, splitMethod) {
        const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        
        if (splitMethod === 'equal') {
            return {
                method: 'equal',
                per_person: total / 2,
                participants: ['You', 'Partner']
            };
        }
        
        return {
            method: splitMethod,
            total: total,
            splits: []
        };
    }

    async saveExpenseTracker(tracker) {
        const filePath = path.join(this.expensesPath, `${tracker.trip_id}.json`);
        await fs.writeJson(filePath, tracker, { spaces: 2 });
    }

    generateInvoiceLineItems(workItems, rates) {
        return workItems.map(item => ({
            description: item.description,
            quantity: item.quantity || 1,
            rate: rates[item.type] || 100,
            amount: (item.quantity || 1) * (rates[item.type] || 100)
        }));
    }

    calculateDueDate() {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30); // 30 days from now
        return dueDate.toISOString().split('T')[0];
    }

    async saveInvoice(invoice) {
        const filePath = path.join(this.planningPath, `invoice-${invoice.id}.json`);
        await fs.writeJson(filePath, invoice, { spaces: 2 });
    }

    async generateMealPlan(preferences, familyMembers, duration) {
        const meals = [];
        const mealTypes = ['breakfast', 'lunch', 'dinner'];
        
        for (let day = 0; day < duration; day++) {
            const dayMeals = {};
            mealTypes.forEach(type => {
                dayMeals[type] = this.generateMeal(type, preferences);
            });
            meals.push(dayMeals);
        }
        
        return meals;
    }

    generateMeal(type, preferences) {
        const mealOptions = {
            breakfast: ['Oatmeal with berries', 'Scrambled eggs', 'Smoothie bowl'],
            lunch: ['Grilled chicken salad', 'Vegetable stir-fry', 'Quinoa bowl'],
            dinner: ['Salmon with vegetables', 'Pasta primavera', 'Turkey chili']
        };
        
        const options = mealOptions[type] || mealOptions.lunch;
        return options[Math.floor(Math.random() * options.length)];
    }

    async generateShoppingList(preferences, duration) {
        return [
            'Chicken breast (2 lbs)',
            'Mixed vegetables (5 lbs)',
            'Rice (1 bag)',
            'Olive oil (1 bottle)',
            'Fresh fruits (assorted)'
        ];
    }

    async generateFamilySchedule(familyMembers, duration) {
        const schedule = {};
        
        familyMembers.forEach(member => {
            schedule[member] = [
                { day: 'Monday', activity: 'Soccer practice', time: '16:00' },
                { day: 'Wednesday', activity: 'Piano lesson', time: '17:00' }
            ];
        });
        
        return schedule;
    }

    async saveMealPlan(mealPlan) {
        const filePath = path.join(this.mealsPath, `meal-plan-${Date.now()}.json`);
        await fs.writeJson(filePath, mealPlan, { spaces: 2 });
    }
}

module.exports = ProductivityPlanningCapability;
