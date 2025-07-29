import { useState, useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Incentive } from '@/lib/incentives';
import { cn } from '@/lib/utils';

// Form schema for incentive
const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  type: z.enum(["voucher", "discount", "points", "lucky_draw", "free_item"]),
  value: z.coerce.number().optional(),
  code_prefix: z.string().max(10, {
    message: "Code prefix must be at most 10 characters."
  }).optional(),
  expires_at: z.date().optional(),
  active: z.boolean().default(true),
  min_rating: z.coerce.number().min(1).max(5).optional(),
  min_review_length: z.coerce.number().min(0).optional(),
  max_per_user: z.coerce.number().min(1).optional(),
  redemption_instructions: z.string().optional(),
});

interface IncentiveFormProps {
  incentive?: Partial<Incentive>;
  onSubmit: (data: z.infer<typeof formSchema>) => void;
  isLoading?: boolean;
}

export function IncentiveForm({ incentive, onSubmit, isLoading = false }: IncentiveFormProps) {
  // Initialize form with default values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: incentive?.name || "",
      description: incentive?.description || "",
      type: incentive?.type || "voucher",
      value: incentive?.value || undefined,
      code_prefix: incentive?.code_prefix || "",
      expires_at: incentive?.expires_at ? new Date(incentive.expires_at) : undefined,
      active: incentive?.active ?? true,
      min_rating: incentive?.min_rating || undefined,
      min_review_length: incentive?.min_review_length || undefined,
      max_per_user: incentive?.max_per_user || undefined,
      redemption_instructions: incentive?.redemption_instructions || "",
    },
  });

  // Selected incentive type state
  const [selectedType, setSelectedType] = useState<string>(incentive?.type || "voucher");

  // Update selectedType when form value changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'type' && value.type) {
        setSelectedType(value.type.toString());
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  // Handle form submission
  function handleSubmit(values: z.infer<typeof formSchema>) {
    onSubmit(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter incentive name" {...field} />
              </FormControl>
              <FormDescription>
                A clear and concise name for this incentive.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter description" 
                  className="resize-none" 
                  {...field} 
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                Optional. Provide details about this incentive.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select 
                  onValueChange={(value) => {
                    field.onChange(value);
                    setSelectedType(value);
                  }}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select incentive type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="voucher">Voucher</SelectItem>
                    <SelectItem value="discount">Discount</SelectItem>
                    <SelectItem value="points">Points</SelectItem>
                    <SelectItem value="lucky_draw">Lucky Draw</SelectItem>
                    <SelectItem value="free_item">Free Item</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  The type of incentive to offer.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Value</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder={selectedType === 'discount' ? "Enter percentage" : "Enter value"}
                    {...field}
                    value={field.value === undefined ? '' : field.value}
                    onChange={(e) => {
                      const value = e.target.value === '' ? undefined : Number(e.target.value);
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormDescription>
                  {selectedType === 'discount' ? 'Percentage discount (e.g., 10 for 10% off)' : 
                   selectedType === 'points' ? 'Number of points to award' :
                   selectedType === 'voucher' ? 'Value of the voucher' : 
                   'Optional value for this incentive'}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="code_prefix"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code Prefix</FormLabel>
                <FormControl>
                  <Input placeholder="Enter prefix (optional)" {...field} value={field.value || ""} />
                </FormControl>
                <FormDescription>
                  Optional. Add a prefix to generated reward codes.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expires_at"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Expiration Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>No expiration</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  Optional. When this incentive expires.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="min_rating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum Rating</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Enter min rating" 
                    min={1} 
                    max={5} 
                    {...field}
                    value={field.value === undefined ? '' : field.value}
                    onChange={(e) => {
                      const value = e.target.value === '' ? undefined : Number(e.target.value);
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormDescription>
                  Minimum star rating (1-5) required.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="min_review_length"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Min. Review Length</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Enter min length"
                    min={0}
                    {...field}
                    value={field.value === undefined ? '' : field.value}
                    onChange={(e) => {
                      const value = e.target.value === '' ? undefined : Number(e.target.value);
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormDescription>
                  Minimum review length in characters.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="max_per_user"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Per User</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Unlimited" 
                    min={1}
                    {...field}
                    value={field.value === undefined ? '' : field.value}
                    onChange={(e) => {
                      const value = e.target.value === '' ? undefined : Number(e.target.value);
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormDescription>
                  Max rewards per user (leave empty for unlimited).
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="redemption_instructions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Redemption Instructions</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter instructions for redeeming this incentive" 
                  className="resize-none" 
                  {...field} 
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                Instructions for customers on how to redeem this incentive.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active</FormLabel>
                <FormDescription>
                  Enable or disable this incentive.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Saving..." : incentive?.id ? "Update Incentive" : "Create Incentive"}
        </Button>
      </form>
    </Form>
  );
}