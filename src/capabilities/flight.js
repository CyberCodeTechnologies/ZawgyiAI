const { ZawgyiCapability } = require('../core/zawgyi-capability');

class FlightCapability extends ZawgyiCapability {
    constructor() {
        super('flight', 'Flight management and check-in automation');
        
        this.airlines = {
            'delta': { name: 'Delta Air Lines', checkin_url: 'https://www.delta.com/check-in' },
            'united': { name: 'United Airlines', checkin_url: 'https://www.united.com/check-in' },
            'american': { name: 'American Airlines', checkin_url: 'https://www.aa.com/check-in' },
            'southwest': { name: 'Southwest Airlines', checkin_url: 'https://www.southwest.com/check-in' }
        };
        
        this.flights = new Map();
        this.setupActions();
    }

    setupActions() {
        this.addAction('checkin', this.checkInFlight.bind(this), {
            description: 'Check in for a flight',
            parameters: ['confirmation_code', 'last_name', 'airline']
        });

        this.addAction('status', this.getFlightStatus.bind(this), {
            description: 'Get flight status',
            parameters: ['confirmation_code', 'last_name', 'airline']
        });

        this.addAction('search', this.searchFlights.bind(this), {
            description: 'Search for flights',
            parameters: ['from', 'to', 'date', 'passengers']
        });

        this.addAction('upcoming', this.getUpcomingFlights.bind(this), {
            description: 'Get upcoming flights',
            parameters: ['user_id']
        });
    }

    async checkInFlight(params, userId) {
        const { confirmation_code, last_name, airline } = params;
        
        if (!confirmation_code || !last_name || !airline) {
            throw new Error('Missing required fields: confirmation_code, last_name, airline');
        }

        const airlineInfo = this.airlines[airline.toLowerCase()];
        if (!airlineInfo) {
            throw new Error(`Unsupported airline: ${airline}. Supported: ${Object.keys(this.airlines).join(', ')}`);
        }

        try {
            // Simulate check-in process
            const checkInResult = await this.simulateCheckIn(confirmation_code, last_name, airline);
            
            // Store check-in record
            const recordId = `checkin_${Date.now()}`;
            this.flights.set(recordId, {
                id: recordId,
                confirmation_code,
                airline: airlineInfo.name,
                user_id: userId,
                check_in_time: new Date().toISOString(),
                status: 'checked_in',
                result: checkInResult
            });
            
            return {
                message: `Successfully checked in for ${airlineInfo.name} flight ${confirmation_code}`,
                details: checkInResult,
                airline: airlineInfo.name,
                confirmation_code,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            throw new Error(`Check-in failed: ${error.message}`);
        }
    }

    async getFlightStatus(params, userId) {
        const { confirmation_code, last_name, airline } = params;
        
        if (!confirmation_code || !last_name || !airline) {
            throw new Error('Missing required fields: confirmation_code, last_name, airline');
        }

        const airlineInfo = this.airlines[airline.toLowerCase()];
        
        // Mock flight status
        const flightStatus = {
            confirmation_code,
            airline: airlineInfo.name,
            flight_number: `${airline.toUpperCase()}${Math.floor(Math.random() * 9000) + 1000}`,
            departure: {
                airport: 'ATL',
                city: 'Atlanta',
                time: '2024-02-15T10:30:00Z',
                gate: 'B12',
                status: 'On Time'
            },
            arrival: {
                airport: 'LAX',
                city: 'Los Angeles', 
                time: '2024-02-15T12:45:00Z',
                gate: 'A23',
                status: 'On Time'
            },
            seat: '12A',
            boarding_group: 'Group 2',
            checked_in: false
        };

        return {
            message: `Flight status for ${confirmation_code}`,
            status: flightStatus,
            timestamp: new Date().toISOString()
        };
    }

    async searchFlights(params, userId) {
        const { from, to, date, passengers = 1 } = params;
        
        if (!from || !to || !date) {
            throw new Error('Missing required fields: from, to, date');
        }

        // Mock flight search results
        const flights = [
            {
                airline: 'Delta Air Lines',
                flight_number: 'DL1234',
                departure: { airport: from, time: '10:30 AM' },
                arrival: { airport: to, time: '12:45 PM' },
                price: 299,
                duration: '4h 15m',
                stops: 0
            },
            {
                airline: 'United Airlines',
                flight_number: 'UA5678',
                departure: { airport: from, time: '2:15 PM' },
                arrival: { airport: to, time: '6:30 PM' },
                price: 275,
                duration: '5h 15m',
                stops: 1
            }
        ];

        return {
            message: `Found ${flights.length} flights from ${from} to ${to} on ${date}`,
            flights,
            search_params: { from, to, date, passengers },
            timestamp: new Date().toISOString()
        };
    }

    async getUpcomingFlights(params, userId) {
        const upcomingFlights = Array.from(this.flights.values())
            .filter(flight => flight.user_id === userId && 
                    new Date(flight.check_in_time) > new Date(Date.now() - 24 * 60 * 60 * 1000))
            .sort((a, b) => new Date(a.check_in_time) - new Date(b.check_in_time));

        return {
            message: `Found ${upcomingFlights.length} upcoming flights`,
            flights: upcomingFlights,
            user_id: userId,
            timestamp: new Date().toISOString()
        };
    }

    async simulateCheckIn(confirmationCode, lastName, airline) {
        // Simulate the check-in process
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    boarding_pass: {
                        confirmation_code: confirmationCode,
                        passenger_name: lastName.toUpperCase(),
                        flight_number: `${airline.toUpperCase()}${Math.floor(Math.random() * 9000) + 1000}`,
                        seat: '12A',
                        boarding_group: 'Group 2',
                        gate: 'B12',
                        departure_time: '10:30 AM',
                        boarding_time: '10:00 AM'
                    },
                    checked_bags: 1,
                    upgrade_available: false,
                    message: 'You are successfully checked in!'
                });
            }, 2000); // Simulate 2 second processing time
        });
    }

    // Helper method to format flight information for display
    formatFlightInfo(flight) {
        return `✈️ ${flight.airline} ${flight.flight_number}
🛫 ${flight.departure.airport} → ${flight.arrival.airport}
🕐 ${flight.departure.time} - ${flight.arrival.time}
💺 Seat: ${flight.seat || 'Not assigned'}
🎫 Confirmation: ${flight.confirmation_code}`;
    }
}

module.exports = FlightCapability;
