"use client"

import { useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { GalleryVerticalEndIcon, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LoginSchema, LoginFormValues } from "@/lib/schemas/auth"
import { loginUserAction } from "@/server/actions/auth"
import { useRouter } from "next/navigation"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      countryCode: "+91",
      mobile: "",
      password: "",
    },
  })

  const countryCode = watch("countryCode")

  function onSubmit(data: LoginFormValues) {
    startTransition(async () => {
      try {
        const result = await loginUserAction(data)
        if (result.error) {
          toast.error(result.error)
        } else if (result.success) {
          toast.success("Successfully logged in!")
          router.push('/fmg-admin')
        }
      } catch (error) {
        toast.error("Something went wrong. Please try again.")
      }
    })
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <a href="#" className="flex flex-col items-center gap-2 font-medium">
          <div className="flex size-8 items-center justify-center rounded-md">
            <GalleryVerticalEndIcon className="size-6" />
          </div>
          <span className="sr-only">Farm Greens</span>
        </a>
        <h1 className="text-xl font-bold">Welcome to Farm Greens</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FieldGroup>
          <div className="flex gap-2 items-start">
            <Field className="w-[100px]">
              <FieldLabel>Code</FieldLabel>
              <Select
                onValueChange={(val) => setValue("countryCode", val)}
                defaultValue={countryCode}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="+91" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="+91">+91</SelectItem>
                  <SelectItem value="+1">+1</SelectItem>
                  <SelectItem value="+44">+44</SelectItem>
                  <SelectItem value="+61">+61</SelectItem>
                </SelectContent>
              </Select>
              <FieldError errors={[errors.countryCode]} />
            </Field>

            <Field className="flex-1">
              <FieldLabel>Mobile Number</FieldLabel>
              <Input
                placeholder="9876543210"
                {...register("mobile")}
                disabled={isPending}
                type="tel"
              />
              <FieldError errors={[errors.mobile]} />
            </Field>
          </div>

          <Field>
            <div className="flex items-center justify-between font-medium">
              <FieldLabel>Password</FieldLabel>
              <a
                href="#"
                className="text-sm font-medium hover:underline text-muted-foreground"
              >
                Forgot password?
              </a>
            </div>
            <Input
              type="password"
              {...register("password")}
              disabled={isPending}
            />
            <FieldError errors={[errors.password]} />
          </Field>
        </FieldGroup>

        <Button
          type="submit"
          className="w-full rounded-2xl"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Please wait
            </>
          ) : (
            "Login"
          )}
        </Button>
      </form>

      <div className="px-6 text-center text-sm text-muted-foreground">
        By clicking continue, you agree to our{" "}
        <a href="#" className="underline underline-offset-4 hover:text-primary">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="#" className="underline underline-offset-4 hover:text-primary">
          Privacy Policy
        </a>
        .
      </div>
    </div>
  )
}

