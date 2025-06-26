import { PeraWalletConnect } from '@perawallet/connect';
import algosdk from 'algosdk';

class WalletService {
  private peraWallet: PeraWalletConnect;
  private connectedAccount: string | null = null;

  constructor() {
    this.peraWallet = new PeraWalletConnect({
      projectId: 'algorand-attendance-app'
    });

    // Reconnect to previously connected account
    this.peraWallet.reconnectSession().then((accounts) => {
      if (accounts.length > 0) {
        this.connectedAccount = accounts[0];
        this.onConnect?.(accounts[0]);
      }
    }).catch((error) => {
      console.warn('Failed to reconnect to wallet:', error);
    });
  }

  public onConnect?: (account: string) => void;
  public onDisconnect?: () => void;

  async connect(): Promise<string> {
    try {
      const accounts = await this.peraWallet.connect();
      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }
      this.connectedAccount = accounts[0];
      this.onConnect?.(accounts[0]);
      return accounts[0];
    } catch (error) {
      console.error('Error connecting wallet:', error);
      if (error instanceof Error && error.message.includes('User rejected')) {
        throw new Error('Wallet connection was cancelled by user');
      }
      throw new Error('Failed to connect wallet. Please try again.');
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.peraWallet.disconnect();
      this.connectedAccount = null;
      this.onDisconnect?.();
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      // Don't throw error on disconnect failure, just clear local state
      this.connectedAccount = null;
      this.onDisconnect?.();
    }
  }

  async signTransaction(txn: algosdk.Transaction): Promise<Uint8Array> {
    if (!this.connectedAccount) {
      throw new Error('No wallet connected');
    }

    try {
      const signedTxn = await this.peraWallet.signTransaction([
        { txn, signers: [this.connectedAccount] }
      ]);
      return signedTxn[0];
    } catch (error) {
      console.error('Error signing transaction:', error);
      throw new Error('Failed to sign transaction. Transaction was cancelled or failed.');
    }
  }

  getConnectedAccount(): string | null {
    return this.connectedAccount;
  }

  isConnected(): boolean {
    return this.connectedAccount !== null;
  }
}

export const walletService = new WalletService();