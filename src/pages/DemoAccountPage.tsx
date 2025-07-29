import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import CreateDemoAccounts from './demo/CreateDemoAccounts';
import CreateSpecificUsers from './demo/CreateSpecificUsers';
import VerifyDemoUsers from './demo/VerifyDemoUsers';

const DemoAccountPage = () => {
  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Demo Account Management</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage demo accounts for testing purposes.
          </p>
        </div>

        <Tabs defaultValue="quick-create">
          <TabsList className="mb-4">
            <TabsTrigger value="quick-create">Quick Create</TabsTrigger>
            <TabsTrigger value="specific-users">Specific Users</TabsTrigger>
            <TabsTrigger value="verify-users">Verify Users</TabsTrigger>
          </TabsList>
          
          <TabsContent value="quick-create">
            <Card>
              <CardHeader>
                <CardTitle>Quick Create Demo Accounts</CardTitle>
                <CardDescription>
                  Create demo merchant and admin accounts with auto-generated credentials
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CreateDemoAccounts />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="specific-users">
            <CreateSpecificUsers />
          </TabsContent>
          
          <TabsContent value="verify-users">
            <VerifyDemoUsers />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DemoAccountPage;