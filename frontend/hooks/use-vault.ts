import { useAccount, useBalance } from "wagmi";
import { parseUnits } from "viem";
import { useState, useCallback } from "react";
import { useContractData, useContractTransaction } from "./use-contract";
import { getContractAddress } from "@/lib/contracts/addresses";
import { useToast } from "@/components/ui/use-toast";

/**
 * Custom hook for interacting with the CrossMindVault contract
 * Provides functionality for deposits, withdrawals, and balance checking
 */
export function useVault() {
  const { address } = useAccount();
  const { toast } = useToast();
  const [isDepositSuccessful, setIsDepositSuccessful] = useState(false);

  // Get vault balance for the connected user
  const {
    data: vaultBalance,
    isLoading: isBalanceLoading,
    refetch: refetchBalance,
  } = useContractData<{
    amount: bigint;
    locked: boolean;
  }>("CrossMindVault", "getBalance", address ? [address] : [], {
    enabled: !!address,
    watch: true,
  });

  // Get the token address from the vault
  const { data: tokenAddress } = useContractData<`0x${string}`>(
    "CrossMindVault",
    "token",
    [],
    { enabled: !!address }
  );

  // Get user's token balance
  const {
    data: tokenBalance,
    isLoading: isTokenBalanceLoading,
    refetch: refetchTokenBalance,
  } = useBalance({
    address,
    token: tokenAddress,
  });

  // Setup deposit transaction
  const {
    writeAsync: depositAsync,
    isPending: isDepositPending,
    transaction: depositTransaction,
  } = useContractTransaction("CrossMindVault", "deposit", {
    onSuccess: () => {
      toast({
        title: "Deposit initiated",
        description: "Your deposit transaction has been submitted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Deposit failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Setup withdraw transaction
  const {
    writeAsync: withdrawAsync,
    isPending: isWithdrawPending,
    transaction: withdrawTransaction,
  } = useContractTransaction("CrossMindVault", "withdrawRequest", {
    onSuccess: () => {
      toast({
        title: "Withdrawal initiated",
        description: "Your withdrawal transaction has been submitted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Withdrawal failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle deposit
  const deposit = useCallback(
    async (amount: string, decimals: number = 6, riskLevel: number = 1) => {
      if (!address) {
        toast({
          title: "Wallet not connected",
          description: "Please connect your wallet to deposit funds.",
          variant: "destructive",
        });
        return {
          success: false,
          error: "Wallet not connected",
        };
      }

      try {
        const parsedAmount = parseUnits(amount, decimals);
        console.log("Depositing", parsedAmount, "with risk level", riskLevel);
        const tx = await depositAsync({ args: [parsedAmount, riskLevel] });

        // Wait for transaction confirmation
        if (depositTransaction.isSuccess) {
          setIsDepositSuccessful(true);
          await refetchBalance();
          await refetchTokenBalance();

          toast({
            title: "Deposit successful",
            description: `Successfully deposited ${amount} tokens.`,
          });

          return {
            success: true,
            transaction: tx,
          };
        } else {
          return {
            success: false,
            error: "Transaction did not complete successfully",
            transaction: tx,
          };
        }
      } catch (error: any) {
        toast({
          title: "Deposit failed",
          description: error.message || "An unknown error occurred",
          variant: "destructive",
        });
        return {
          success: false,
          error: error.message || "An unknown error occurred",
        };
      }
    },
    [
      address,
      depositAsync,
      depositTransaction.isSuccess,
      refetchBalance,
      refetchTokenBalance,
      toast,
    ]
  );

  // Handle withdrawal
  const withdraw = useCallback(
    async (amount: string, decimals: number = 6) => {
      if (!address) {
        toast({
          title: "Wallet not connected",
          description: "Please connect your wallet to withdraw funds.",
          variant: "destructive",
        });
        return;
      }

      try {
        const parsedAmount = parseUnits(amount, decimals);
        const tx = await withdrawAsync({ args: [parsedAmount] });

        // Wait for transaction confirmation
        if (withdrawTransaction.isSuccess) {
          await refetchBalance();
          await refetchTokenBalance();

          toast({
            title: "Withdrawal successful",
            description: `Successfully withdrew ${amount} tokens.`,
          });

          return tx;
        }
      } catch (error: any) {
        toast({
          title: "Withdrawal failed",
          description: error.message || "An unknown error occurred",
          variant: "destructive",
        });
        return null;
      }
    },
    [
      address,
      withdrawAsync,
      withdrawTransaction.isSuccess,
      refetchBalance,
      refetchTokenBalance,
      toast,
    ]
  );

  // Reset deposit success state
  const resetDepositSuccess = useCallback(() => {
    setIsDepositSuccessful(false);
  }, []);

  return {
    // Balance data
    balance: vaultBalance,
    tokenBalance,
    isBalanceLocked: vaultBalance?.locked || false,
    isBalanceLoading: isBalanceLoading || isTokenBalanceLoading,

    // Deposit functionality
    deposit,
    isDepositPending,
    isDepositSuccessful,
    resetDepositSuccess,
    depositTransaction,

    // Withdraw functionality
    withdraw,
    isWithdrawPending,
    withdrawTransaction,

    // Refresh functions
    refetchBalance,
    refetchTokenBalance,
  };
}
