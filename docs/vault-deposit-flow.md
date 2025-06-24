# CrossMind Vault Deposit Flow

## Vault Deposit Event ABI

The CrossMind Vault contract emits a `Deposit` event when users deposit funds. This event has the following structure:

```solidity
{
  anonymous: false,
  inputs: [
    {
      indexed: true,
      internalType: "address",
      name: "user",
      type: "address",
    },
    {
      indexed: false,
      internalType: "uint256",
      name: "amount",
      type: "uint256",
    },
  ],
  name: "Deposit",
  type: "event",
}
```

## Deposit Flow with Agent Integration

The deposit flow integrates with the Zoya AI agent through the following steps:

1. **User Initiates Deposit**: User enters an amount and clicks the deposit button.

2. **Token Approval**: If needed, the application first requests token approval.
   ```typescript
   // Check and request approval if needed
   const needsApproval = await checkAllowance(amount);
   if (needsApproval) {
     await approveToken(amount);
   }
   ```

3. **Contract Deposit**: The application calls the vault contract's `deposit` function with the user's amount:
   ```typescript
   // Call contract with properly formatted arguments
   const parsedAmount = parseUnits(amount, decimals);
   const tx = await depositAsync({ args: [parsedAmount] });
   ```

4. **Transaction Confirmation**: The application waits for the transaction confirmation before proceeding:
   ```typescript
   // Only proceed after successful transaction
   const result = await deposit(amount);
   if (result && result.success) {
     // Proceed to next step
   }
   ```

5. **Agent Notification**: After successful deposit, a message is sent to Zoya via the messaging system:
   ```typescript
   // Send message to Zoya with deposit details
   const message = `I've deposited ${amount} USDC. I'd like a ${riskLevel} risk strategy. Can you help me create one?`;
   sendMessage(message, serverId, "user", undefined, messageId, payload, channelId);
   ```

## Implementation Notes

1. **Parameter Requirements**: 
   - The Vault `deposit` function requires a uint256 amount parameter.
   - Before calling the function, the amount must be parsed using `parseUnits(amount, decimals)`.

2. **Transaction Status Handling**:
   - The `useVault.deposit` hook returns a structured result object: 
     ```typescript
     {
       success: boolean;
       transaction?: TransactionResponse;
       error?: string;
     }
     ```
   - Always check `result.success` before proceeding with agent notification.

3. **Error Handling**:
   - Deposit failures are captured and can be communicated to the agent for a seamless user experience.
   - If a deposit fails, the error message can be sent to the agent to request assistance.
