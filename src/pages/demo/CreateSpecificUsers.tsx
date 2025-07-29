import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createSpecificUser } from '@/lib/auth';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  role: z.string().min(1, { message: "Role is required" }),
  businessName: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const CreateSpecificUsers = () => {
  const [loading, setLoading] = useState(false);
  const [createdUsers, setCreatedUsers] = useState<{ email: string; password: string; role: string }[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: '',
      businessName: '',
    },
  });

  const selectedRole = form.watch("role");

  const handleCreateUser = async (values: FormValues) => {
    setLoading(true);
    try {
      const result = await createSpecificUser({
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
        role: values.role,
        businessName: values.businessName,
      });

      setCreatedUsers((prev) => [
        ...prev, 
        { 
          email: result.email, 
          password: result.password, 
          role: values.role 
        }
      ]);
      
      toast.success(`${values.role} account created successfully!`);
      
      form.reset({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: values.role, // Keep the same role for convenience
        businessName: '',
      });
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error("Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Demo Accounts</CardTitle>
          <CardDescription>
            Create specific demo accounts for testing purposes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateUser)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="John" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Doe" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="name@example.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" placeholder="********" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="merchant">Merchant</SelectItem>
                        <SelectItem value="customer">Customer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedRole === "merchant" && (
                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Acme Corporation" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Spinner className="mr-2" /> : null}
                Create Account
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {createdUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Created Accounts</CardTitle>
            <CardDescription>
              Login credentials for the accounts you've created
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md divide-y">
              {createdUsers.map((user, index) => (
                <div key={index} className="p-4">
                  <div className="font-medium">{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</div>
                  <div className="text-sm text-muted-foreground mt-1">Email: {user.email}</div>
                  <div className="text-sm text-muted-foreground">Password: {user.password}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CreateSpecificUsers;