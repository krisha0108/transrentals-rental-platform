
import { servicesAPI } from '../src/lib/api/services';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
    console.log('Testing servicesAPI.getServices()...');
    try {
        const services = await servicesAPI.getServices();
        console.log('Success!', services);
    } catch (error: any) {
        console.error('Error caught:');
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        } else {
            console.error('Full Error object:', error);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
    }
}

main();
