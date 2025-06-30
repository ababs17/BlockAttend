import algosdk from 'algosdk';
import { AlgorandConfig, AttendanceSession, AttendanceRecord } from '../types';

class AlgorandService {
  private algodClient: algosdk.Algodv2;
  private indexerClient: algosdk.Indexer;
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

    // Initialize indexer for querying blockchain data
    this.indexerClient = new algosdk.Indexer(
      '',
      'https://testnet-idx.algonode.cloud',
      443
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
    sessionData: Omit<AttendanceSession, 'id' | 'attendeeCount' | 'verifiedChecker'>
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
        allowedRadius: sessionData.allowedRadius,
        checkInWindow: sessionData.checkInWindow,
        excuseDeadlineHours: sessionData.excuseDeadlineHours,
        checkerAddress: senderAddress
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
    studentLocation?: { latitude: number; longitude: number },
    sessionCreator?: string
  ) {
    try {
      const params = await this.algodClient.getTransactionParams().do();
      
      const note = new TextEncoder().encode(JSON.stringify({
        type: 'RECORD_ATTENDANCE',
        sessionId,
        timestamp: new Date().toISOString(),
        studentAddress,
        studentLocation,
        sessionCreator
      }));

      const txn = algosdk.makePaymentTxnWithSuggestedParams(
        studentAddress,
        sessionCreator || studentAddress, // Send to session creator if available
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

  async submitExcuse(
    studentAddress: string,
    sessionId: string,
    reason: string,
    sessionCreator?: string
  ) {
    try {
      const params = await this.algodClient.getTransactionParams().do();
      
      const note = new TextEncoder().encode(JSON.stringify({
        type: 'SUBMIT_EXCUSE',
        sessionId,
        studentAddress,
        reason,
        timestamp: new Date().toISOString()
      }));

      const txn = algosdk.makePaymentTxnWithSuggestedParams(
        studentAddress,
        sessionCreator || studentAddress,
        1000,
        undefined,
        note,
        params
      );

      return txn;
    } catch (error) {
      console.error('Error submitting excuse:', error);
      throw new Error('Failed to submit excuse');
    }
  }

  async reviewExcuse(
    reviewerAddress: string,
    excuseId: string,
    status: 'approved' | 'rejected',
    reviewNotes?: string
  ) {
    try {
      const params = await this.algodClient.getTransactionParams().do();
      
      const note = new TextEncoder().encode(JSON.stringify({
        type: 'REVIEW_EXCUSE',
        excuseId,
        status,
        reviewNotes,
        reviewerAddress,
        timestamp: new Date().toISOString()
      }));

      const txn = algosdk.makePaymentTxnWithSuggestedParams(
        reviewerAddress,
        reviewerAddress,
        1000,
        undefined,
        note,
        params
      );

      return txn;
    } catch (error) {
      console.error('Error reviewing excuse:', error);
      throw new Error('Failed to review excuse');
    }
  }

  async getTransactionsByAddress(address: string, limit: number = 100): Promise<any[]> {
    try {
      const response = await this.indexerClient
        .lookupAccountTransactions(address)
        .limit(limit)
        .do();
      
      return response.transactions || [];
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  }

  async getTransactionById(txId: string): Promise<any> {
    try {
      const response = await this.indexerClient.lookupTransactionByID(txId).do();
      return response.transaction;
    } catch (error) {
      console.error('Error fetching transaction:', error);
      return null;
    }
  }

  parseTransactionNote(note: string): any {
    try {
      const decoded = new TextDecoder().decode(Buffer.from(note, 'base64'));
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Error parsing transaction note:', error);
      return null;
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

  // Get minimum balance for account
  async getMinimumBalance(address: string): Promise<number> {
    try {
      const accountInfo = await this.getAccountInfo(address);
      return accountInfo['min-balance'];
    } catch (error) {
      console.error('Error getting minimum balance:', error);
      return 100000; // Default minimum balance
    }
  }

  // Check if account has sufficient balance for transaction
  async checkSufficientBalance(address: string, amount: number = 1000): Promise<boolean> {
    try {
      const accountInfo = await this.getAccountInfo(address);
      const balance = accountInfo.amount;
      const minBalance = accountInfo['min-balance'];
      return balance >= (minBalance + amount + 1000); // Include transaction fee
    } catch (error) {
      console.error('Error checking balance:', error);
      return false;
    }
  }
}

export const algorandService = new AlgorandService();