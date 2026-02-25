"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "@/lib/sweetalert"
import { IconRadar, IconLoader2 } from "@tabler/icons-react"

import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const signInSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
})

type SignInValues = z.infer<typeof signInSchema>

export default function SignInPage() {
  const { login, isAuthenticated } = useAuth()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
  })

  React.useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard")
    }
  }, [isAuthenticated, router])

  const onSubmit = async (data: SignInValues) => {
    setIsSubmitting(true)
    try {
      await login(data.username, data.password)
      toast.success("Signed in successfully")
      router.push("/dashboard")
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Invalid credentials"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-sm border-border/50 bg-card">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <IconRadar className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-xl text-card-foreground">
          Sign in to Radon
        </CardTitle>
        <CardDescription>
          Cybersecurity Reconnaissance Platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="username" className="text-card-foreground">
              Username
            </Label>
            <Input
              id="username"
              placeholder="Enter your username"
              {...register("username")}
              autoComplete="username"
              autoFocus
            />
            {errors.username && (
              <p className="text-sm text-destructive">
                {errors.username.message}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password" className="text-card-foreground">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              {...register("password")}
              autoComplete="current-password"
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && (
              <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Sign In
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {"Don't have an account? "}
            <Link
              href="/signup"
              className="text-primary underline-offset-4 hover:underline"
            >
              Sign up
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
