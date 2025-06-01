"use client";

import { useState } from "react";
import { WalletConnectionWrapper } from "@/components/shared/wallet-connection-wrapper";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Bell,
  Lock,
  CreditCard,
  Globe,
  ArrowRightLeft,
  Info,
  Shield,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { ErrorBoundary } from "@/components/error-boundary";

export default function SettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [autoRebalance, setAutoRebalance] = useState(true);
  const [defaultChain, setDefaultChain] = useState("ethereum");
  const [gasPreference, setGasPreference] = useState("standard");
  const [email, setEmail] = useState("user@example.com");
  const [securityLevel, setSecurityLevel] = useState("standard");

  const handleSaveGeneral = () => {
    toast({
      title: "Settings updated",
      description: "Your general settings have been saved.",
      variant: "default",
    });
  };

  const handleSaveNotifications = () => {
    toast({
      title: "Notification preferences updated",
      description: "Your notification settings have been saved.",
      variant: "default",
    });
  };

  const handleSaveSecurity = () => {
    toast({
      title: "Security settings updated",
      description: "Your security preferences have been saved.",
      variant: "default",
    });
  };

  const handleSaveTransactions = () => {
    toast({
      title: "Transaction settings updated",
      description: "Your transaction preferences have been saved.",
      variant: "default",
    });
  };

  return (
    <WalletConnectionWrapper>
      <div className="container py-8 animate-in fade-in duration-300">
        <ErrorBoundary>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
              <p className="text-muted-foreground">
                Manage your account and application preferences
              </p>
            </div>
          </div>

          <div className="mt-8">
            <Tabs
              defaultValue="general"
              onValueChange={setActiveTab}
              value={activeTab}
            >
              <TabsList className="grid w-full grid-cols-4 lg:w-auto">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>General Settings</CardTitle>
                    <CardDescription>
                      Manage your basic account preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      <p className="text-sm text-muted-foreground">
                        We'll use this email for notifications and account
                        recovery
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="defaultChain">Default Network</Label>
                      <Select
                        value={defaultChain}
                        onValueChange={setDefaultChain}
                      >
                        <SelectTrigger id="defaultChain">
                          <SelectValue placeholder="Select a network" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ethereum">Ethereum</SelectItem>
                          <SelectItem value="avalanche">Avalanche</SelectItem>
                          <SelectItem value="base">Base</SelectItem>
                          <SelectItem value="arbitrum">Arbitrum</SelectItem>
                          <SelectItem value="polygon">Polygon</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        Default network for deposits and withdrawals
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="theme">Dark Mode</Label>
                          <p className="text-sm text-muted-foreground">
                            Toggle between light and dark themes
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Use the theme toggle in the navigation menu
                        </p>
                      </div>
                    </div>

                    <div className="pt-4">
                      <Button onClick={handleSaveGeneral}>Save Changes</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notifications" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>
                      Manage how you receive alerts and updates
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Email Notifications</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive strategy updates and performance reports
                          </p>
                        </div>
                        <Switch
                          checked={emailNotifications}
                          onCheckedChange={setEmailNotifications}
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Push Notifications</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive real-time alerts for important events
                          </p>
                        </div>
                        <Switch
                          checked={pushNotifications}
                          onCheckedChange={setPushNotifications}
                        />
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <Label>Notification Types</Label>
                        <div className="grid gap-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                            <span className="text-sm">Strategy approvals</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                            <span className="text-sm">
                              Portfolio rebalances
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                            <span className="text-sm">
                              Deposit confirmations
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            <span className="text-sm">Security alerts</span>
                            <span className="ml-auto text-xs text-muted-foreground">
                              (Cannot be disabled)
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4">
                      <Button onClick={handleSaveNotifications}>
                        Save Preferences
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                    <CardDescription>
                      Manage security options for your account
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="securityLevel">Security Level</Label>
                      <Select
                        value={securityLevel}
                        onValueChange={setSecurityLevel}
                      >
                        <SelectTrigger id="securityLevel">
                          <SelectValue placeholder="Select security level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="enhanced">Enhanced</SelectItem>
                          <SelectItem value="maximum">Maximum</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        Higher security levels require additional verification
                        for transactions
                      </p>
                    </div>

                    <div className="space-y-4 pt-2">
                      <div className="rounded-md border p-4">
                        <div className="flex items-start gap-4">
                          <div className="rounded-full bg-primary/10 p-2">
                            <Shield className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium">
                              Wallet Security
                            </h4>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Your wallet credentials are never stored.
                              CrossMind uses secure, non-custodial connections
                              to interact with your wallet.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-md border p-4">
                        <div className="flex items-start gap-4">
                          <div className="rounded-full bg-primary/10 p-2">
                            <Lock className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium">
                              Strategy Approval
                            </h4>
                            <p className="mt-1 text-xs text-muted-foreground">
                              All AI-generated strategies require explicit
                              approval before execution. Auto-approval can be
                              enabled for strategies within your risk
                              parameters.
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                              <Switch id="auto-approve" />
                              <Label htmlFor="auto-approve" className="text-xs">
                                Enable auto-approval for low-risk strategies
                              </Label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4">
                      <Button onClick={handleSaveSecurity}>
                        Save Security Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="transactions" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Transaction Settings</CardTitle>
                    <CardDescription>
                      Manage preferences for your DeFi transactions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Automatic Rebalancing</Label>
                          <p className="text-sm text-muted-foreground">
                            Allow CrossMind to automatically rebalance your
                            portfolio
                          </p>
                        </div>
                        <Switch
                          checked={autoRebalance}
                          onCheckedChange={setAutoRebalance}
                        />
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <Label htmlFor="gasPreference">
                          Gas Price Preference
                        </Label>
                        <Select
                          value={gasPreference}
                          onValueChange={setGasPreference}
                        >
                          <SelectTrigger id="gasPreference">
                            <SelectValue placeholder="Select gas preference" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="slow">
                              Slow (Cheapest)
                            </SelectItem>
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="fast">Fast</SelectItem>
                            <SelectItem value="instant">
                              Instant (Highest)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                          Select how quickly you want transactions to be
                          processed
                        </p>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <Label>Transaction Limits</Label>
                        <div className="rounded-md border p-4 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label
                                htmlFor="max-transaction"
                                className="text-sm"
                              >
                                Maximum Transaction
                              </Label>
                              <div className="relative mt-1">
                                <span className="absolute left-3 top-1/2  -translate-y-1/2 text-muted-foreground">
                                  $
                                </span>
                                <Input
                                  id="max-transaction"
                                  className="pl-8"
                                  placeholder="1000"
                                  defaultValue="1000"
                                />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="daily-limit" className="text-sm">
                                Daily Limit
                              </Label>
                              <div className="relative mt-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                  $
                                </span>
                                <Input
                                  id="daily-limit"
                                  className="pl-8"
                                  placeholder="5000"
                                  defaultValue="5000"
                                />
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Set limits to control the maximum amount that can be
                            transacted at once or within a day
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4">
                      <Button onClick={handleSaveTransactions}>
                        Save Transaction Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </ErrorBoundary>
      </div>
    </WalletConnectionWrapper>
  );
}
