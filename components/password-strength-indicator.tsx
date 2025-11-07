"use client"

import { Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface PasswordRule {
  label: string
  test: (password: string) => boolean
}

const passwordRules: PasswordRule[] = [
  { label: "At least 8 characters", test: (pwd) => pwd.length >= 8 },
  { label: "Contains uppercase letter", test: (pwd) => /[A-Z]/.test(pwd) },
  { label: "Contains lowercase letter", test: (pwd) => /[a-z]/.test(pwd) },
  { label: "Contains number", test: (pwd) => /[0-9]/.test(pwd) },
  { label: "Contains special character", test: (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd) },
]

export function PasswordStrengthIndicator({ password }: { password: string }) {
  const passedRules = passwordRules.filter((rule) => rule.test(password)).length
  const strength = (passedRules / passwordRules.length) * 100

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-300",
              strength < 40 && "bg-destructive",
              strength >= 40 && strength < 80 && "bg-yellow-500",
              strength >= 80 && "bg-green-500",
            )}
            style={{ width: `${strength}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground">
          {strength < 40 ? "Weak" : strength < 80 ? "Fair" : "Strong"}
        </span>
      </div>
      <div className="space-y-1">
        {passwordRules.map((rule, index) => {
          const passed = rule.test(password)
          return (
            <div key={index} className="flex items-center gap-2 text-xs">
              {passed ? <Check className="h-3 w-3 text-green-500" /> : <X className="h-3 w-3 text-muted-foreground" />}
              <span className={cn("text-muted-foreground", passed && "text-foreground")}>{rule.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
  const passedRules = passwordRules.filter((rule) => rule.test(password))

  if (passedRules.length < passwordRules.length) {
    return {
      valid: false,
      message: "Password must meet all requirements",
    }
  }

  return { valid: true }
}
