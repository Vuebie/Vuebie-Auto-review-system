import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { sendVerificationEmail } from '@/lib/api-client';

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email" }),
});

type FormValues = z.infer<typeof formSchema>;

const VerifyDemoUsers = () => {
  const [loading, setLoading] = useState(false);
  const [sentEmails, setSentEmails] = useState<string[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  const handleSendVerification = async (values: FormValues) => {
    setLoading(true);
    try {
      await sendVerificationEmail(values.email);
      
      setSentEmails((prev) => [...prev, values.email]);
      
      toast.success(`Verification email sent to ${values.email}`);
      
      form.reset({
        email: '',
      });
    } catch (error) {
      console.error("Error sending verification email:", error);
      toast.error("Failed to send verification email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Verify Demo Users</CardTitle>
          <CardDescription>
            Send verification emails to demo users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSendVerification)} className="space-y-4">
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

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Spinner className="mr-2" /> : null}
                Send Verification Email
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {sentEmails.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sent Verification Emails</CardTitle>
            <CardDescription>
              Verification emails have been sent to these addresses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md divide-y">
              {sentEmails.map((email, index) => (
                <div key={index} className="p-4">
                  <div className="text-sm">{email}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VerifyDemoUsers;