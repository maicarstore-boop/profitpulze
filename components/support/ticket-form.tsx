"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FiCheckCircle } from "react-icons/fi";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const schema = z.object({
  category: z.string().min(1),
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  description: z.string().min(20, "Please provide at least 20 characters of detail"),
});

type FormValues = z.infer<typeof schema>;

const CATEGORIES = ["Account & Verification", "Deposits & Withdrawals", "Trading", "Security", "Other"];

export function TicketForm() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { category: CATEGORIES[0] } });

  if (sent) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <FiCheckCircle className="h-8 w-8 text-success" />
          <h3 className="font-semibold">Ticket #PP-48213 submitted</h3>
          <p className="text-sm text-muted-foreground">
            Our support team will follow up by email, usually within a few hours.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-lg">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(() => setSent(true))} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="category">Category</Label>
            <Select id="category" {...register("category")}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" placeholder="Brief summary of your issue" {...register("subject")} />
            {errors.subject && <p className="text-xs text-danger">{errors.subject.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
            {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" placeholder="Include as much detail as possible" {...register("description")} />
            {errors.description && <p className="text-xs text-danger">{errors.description.message}</p>}
          </div>
          <Button type="submit" size="lg" className="w-full">
            Submit Ticket
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
