import { useState } from 'react';
import { useCreateStrategy } from '@/hooks/use-strategies';
import { useContractChainSupport } from '@/hooks/use-contract';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';

/**
 * Form component for creating a new strategy
 */
export function CreateStrategyForm() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { toast } = useToast();
  
  // Check if the StrategyRegistry contract is supported on the current chain
  const { isSupported, currentChainName } = useContractChainSupport('StrategyRegistry');
  
  // Use our custom hook for creating strategies
  const { 
    createStrategy, 
    isPending, 
    transaction, 
    error,
    chainId,
    connectedAddress
  } = useCreateStrategy({
    onSuccess: (data) => {
      toast({
        title: 'Strategy created!',
        description: `Your strategy "${name}" was successfully created.`,
      });
      
      // Reset form
      setName('');
      setDescription('');
    },
    onError: (error) => {
      toast({
        title: 'Error creating strategy',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !description) {
      toast({
        title: 'Missing information',
        description: 'Please provide both a name and description for your strategy.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      await createStrategy(name, description);
    } catch (err) {
      console.error('Error creating strategy:', err);
    }
  };
  
  if (!isSupported) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Unsupported Network</AlertTitle>
        <AlertDescription>
          The Strategy Registry contract is not deployed on {currentChainName || 'the current network'}.
          Please switch to a supported network.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          Strategy Name
        </label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter a name for your strategy"
          disabled={isPending}
          required
        />
      </div>
      
      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your investment strategy..."
          rows={4}
          disabled={isPending}
          required
        />
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}
      
      {transaction.isSuccess && (
        <Alert>
          <AlertTitle>Strategy Created</AlertTitle>
          <AlertDescription>
            Your strategy has been created successfully!
            Transaction hash: {transaction.data?.transactionHash}
          </AlertDescription>
        </Alert>
      )}
      
      <Button type="submit" disabled={isPending || !name || !description}>
        {isPending ? 'Creating...' : 'Create Strategy'}
      </Button>
    </form>
  );
}
