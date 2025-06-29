import { useState, useCallback } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseUnits } from "viem";
import { useToast } from "@/components/ui/use-toast";
import { getContractAddress } from "@/lib/contracts/addresses";
import { avalancheFuji } from "wagmi/chains";
// Standard ERC20 ABI for approval and allowance functions
export const ERC20_ABI = [
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

/**
 * Custom hook for handling token approvals for the CrossMindVault contract
 *
 * @param tokenAddress Address of the ERC20 token to approve
 * @returns Functions and state for checking and setting token approvals
 */
export function useTokenApproval(tokenAddress?: `0x${string}`) {
  const { address } = useAccount();
  const { toast } = useToast();
  const [isCheckingAllowance, setIsCheckingAllowance] = useState(false);

  // Get the vault contract address
  const vaultAddress = getContractAddress("CrossMindVault", avalancheFuji.id);

  // Check token allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address && vaultAddress ? [address, vaultAddress] : undefined,
  });

  // Setup token approval
  const {
    writeContract,
    data: approvalHash,
    isPending: isApprovalPending,
    error: approvalError,
  } = useWriteContract();

  // Track approval transaction
  const {
    data: approvalReceipt,
    isLoading: isApprovalConfirming,
    isSuccess: isApprovalSuccess,
    error: approvalConfirmError,
  } = useWaitForTransactionReceipt({
    hash: approvalHash,
  });

  // Check if the allowance is sufficient for a given amount
  const checkAllowance = useCallback(
    async (amount: string, decimals: number = 6) => {
      if (!address || !vaultAddress || !tokenAddress) {
        return false;
      }

      setIsCheckingAllowance(true);

      try {
        const { data } = await refetchAllowance();
        const parsedAmount = parseUnits(amount, decimals);

        setIsCheckingAllowance(false);
        return data !== undefined && data >= parsedAmount;
      } catch (error) {
        setIsCheckingAllowance(false);
        return false;
      }
    },
    [address, vaultAddress, tokenAddress, refetchAllowance],
  );

  // Approve tokens for the vault
  const approveTokens = useCallback(
    async (amount: string, decimals: number = 6) => {
      if (!address || !vaultAddress || !tokenAddress) {
        toast({
          title: "Approval failed",
          description: "Missing wallet connection or contract addresses",
          variant: "destructive",
        });
        return {
          success: false,
          error: "Missing wallet connection or contract addresses",
        };
      }

      try {
        const parsedAmount = parseUnits(amount, decimals);

        // Submit approval transaction
        const hash = await writeContract({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [vaultAddress, parsedAmount],
        });

        toast({
          title: "Approval submitted",
          description: "Please wait for the transaction to be confirmed",
        });

        // Instead of waiting for the receipt in a complicated way, simply return the hash
        // and let the useWaitForTransactionReceipt hook do its work
        console.log("Approval transaction hash:", hash);

        // Return a simpler structure
        return { success: true, hash };
      } catch (error: any) {
        toast({
          title: "Approval failed",
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
      vaultAddress,
      tokenAddress,
      writeContract,
      toast,
      approvalReceipt,
      approvalConfirmError,
    ],
  );

  // Approve maximum tokens (infinite approval)
  const approveMaxTokens = useCallback(async () => {
    if (!address || !vaultAddress || !tokenAddress) {
      toast({
        title: "Approval failed",
        description: "Missing wallet connection or contract addresses",
        variant: "destructive",
      });
      return null;
    }

    try {
      // Max uint256 value for infinite approval
      const maxUint256 = BigInt(
        "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
      );

      const hash = await writeContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [vaultAddress, maxUint256],
      });

      toast({
        title: "Maximum approval submitted",
        description: "Please wait for the transaction to be confirmed",
      });

      return hash;
    } catch (error: any) {
      toast({
        title: "Approval failed",
        description: error.message || "An unknown error occurred",
        variant: "destructive",
      });
      return null;
    }
  }, [address, vaultAddress, tokenAddress, writeContract, toast]);

  return {
    // Allowance data
    checkAllowance,
    approveTokens,
    approveMaxTokens,
    isChecking: isCheckingAllowance,
    isPending: isApprovalPending || isApprovalConfirming,
    isError: !!approvalError || !!approvalConfirmError,
    error: approvalError || approvalConfirmError,
    isApprovalSuccess,
    approvalHash,
    approvalReceipt,
  };
}
