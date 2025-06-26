import algosdk from 'algosdk';
import { AlgorandConfig, AttendanceSession } from '../types';

class AlgorandService {
  private algodClient: algosdk.Algodv2;
  private config: AlgorandConfig;

  constructor() {
    // Using Algorand TestNet for development
    this.config = {
      server: 'https://testnet-api.algonode.cloud',
      port: 443,
      token: '',
      network: 'TestNet'
    };

    this.algodClient = new algosdk.Algodv2(
      this.config.token,
      this.config.server,
      this.config.port
    );
  }

  async getAccountInfo(address: string) {
    try {
      return await this.algodClient.accountInformation(address).do();
    } catch (error) {
      console.error('Error getting account info:', error);
      throw new Error('Failed to get account information');
    }
  }

  async submitTransaction(signedTxn: Uint8Array) {
    try {
      const { txId } = await this.algodClient.sendRawTransaction(signedTxn).do();
      await algosdk.waitForConfirmation(this.algodClient, txId, 4);
      return txId;
    } catch (error) {
      console.error('Error submitting transaction:', error);
      throw new Error('Failed to submit transaction');
    }
  }

  async createAttendanceSession(
    senderAddress: string,
    sessionData: Omit<AttendanceSession, 'id' | 'attendeeCount'>
  ) {
    try {
      const params = await this.algodClient.getTransactionParams().do();
      
      // Create application call transaction to store session data
      const note = new TextEncoder().encode(JSON.stringify({
        type: 'DECLARE_CLASS_SESSION',
        courseCode: sessionData.courseCode,
        courseName: sessionData.courseName,
        description: sessionData.description,
        startTime: sessionData.startTime.toISOString(),
        endTime: sessionData.endTime.toISOString(),
        isActive: sessionData.isActive,
        location: sessionData.location,
        declarationTime: sessionData.declarationTime.toISOString(),
        checkerAddress: senderAddress // Wallet address of the checker (lecturer/class rep)
      }));

      const txn = algosdk.makePaymentTxnWithSuggestedParams(
        senderAddress,
        senderAddress,
        1000, // Minimum transaction amount (1000 microAlgos = 0.001 ALGO)
        undefined,
        note,
        params
      );

      return txn;
    } catch (error) {
      console.error('Error creating attendance session:', error);
      throw new Error('Failed to create attendance session');
    }
  }

  async recordAttendance(
    studentAddress: string,
    sessionId: string,
    studentLocation?: { latitude: number; longitude: number }
  ) {
    try {
      const params = await this.algodClient.getTransactionParams().do();
      
      const note = new TextEncoder().encode(JSON.stringify({
        type: 'RECORD_ATTENDANCE',
        sessionId,
        timestamp: new Date().toISOString(),
        studentAddress,
        studentLocation
      }));

      const txn = algosdk.makePaymentTxnWithSuggestedParams(
        studentAddress,
        studentAddress,
        1000,
        undefined,
        note,
        params
      );

      return txn;
    } catch (error) {
      console.error('Error recording attendance:', error);
      throw new Error('Failed to record attendance');
    }
  }

  generateSessionId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  // Test connection method
  async testConnection(): Promise<boolean> {
    try {
      await this.algodClient.status().do();
      return true;
    } catch (error) {
      console.error('Algorand connection test failed:', error);
      return false;
    }
  }
}

export const algorandService = new AlgorandService();