"use client";

import { useState } from "react";
import Link from "next/link";
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
import { useAuth } from "@/components/auth/auth-provider";
import { SUPPORT_CATEGORY_OPTIONS } from "@/components/support/support-inbox";

const schema = z.object({
  category: z.string().min(1),
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  description: z.string().min(20, "Please provide at least 20 characters of detail"),
});

type FormValues = z.infer<typeof schema>;

export function TicketForm() {
  const { user } = useAuth();
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { category: SUPPORT_CATEGORY_OPTIONS[0] } });

  if (!user) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <h3 className="font-semibold">Log in to contact support</h3>
          <p className="text-sm text-muted-foreground">
            Tickets are handled as in-app conversations so you can chat with our team and track replies.
          </p>
          <Link href="/login">
            <Button>Log In</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (createdId) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <FiCheckCircle className="h-8 w-8 text-success" />
          <h3 className="font-semibold">Ticket submitted</h3>
          <p className="text-sm text-muted-foreground">
            Our support team will reply in your Messages inbox, usually within a few hours. You&apos;ll get a notification when they do.
          </p>
          <Link href={`/support?c=${createdId}`}>
            <Button>View Conversation</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    const res = await fetch("/api/support/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: values.category, subject: values.subject, body: values.description }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.conversation) {
      setSubmitError(data.error ?? "Failed to submit ticket. Please try again.");
      return;
    }
    setCreatedId(data.conversation.id);
  };

  return (
    <Card className="mx-auto max-w-lg">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="category">Category</Label>
            <Select id="category" {...register("category")}>
              {SUPPORT_CATEGORY_OPTIONS.map((c) => (
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
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" placeholder="Include as much detail as possible" {...register("description")} />
            {errors.description && <p className="text-xs text-danger">{errors.description.message}</p>}
          </div>
          {submitError && <p className="text-xs text-danger">{submitError}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Submitting…" : "Submit Ticket"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
