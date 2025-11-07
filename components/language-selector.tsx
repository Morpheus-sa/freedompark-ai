"use client"
import { Check, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

export const SUPPORTED_LANGUAGES = [
  { code: "en-ZA", name: "English (South Africa)", flag: "🇿🇦" },
  { code: "af-ZA", name: "Afrikaans", flag: "🇿🇦" },
  { code: "zu-ZA", name: "Zulu", flag: "🇿🇦" },
  { code: "xh-ZA", name: "Xhosa", flag: "🇿🇦" },
  { code: "st-ZA", name: "Sesotho", flag: "🇿🇦" },
  { code: "tn-ZA", name: "Setswana", flag: "🇿🇦" },
]

interface LanguageSelectorProps {
  selectedLanguage: string
  onLanguageChange: (languageCode: string) => void
  disabled?: boolean
  variant?: "button" | "badge"
}

export function LanguageSelector({
  selectedLanguage,
  onLanguageChange,
  disabled = false,
  variant = "button",
}: LanguageSelectorProps) {
  const currentLanguage = SUPPORTED_LANGUAGES.find((lang) => lang.code === selectedLanguage) || SUPPORTED_LANGUAGES[0]

  if (variant === "badge") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Badge variant="outline" className="cursor-pointer gap-2 hover:bg-accent">
            <Globe className="h-3 w-3" />
            <span>
              {currentLanguage.flag} {currentLanguage.name}
            </span>
          </Badge>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[280px]">
          <DropdownMenuLabel>Select Language</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {SUPPORTED_LANGUAGES.map((language) => (
            <DropdownMenuItem
              key={language.code}
              onClick={() => onLanguageChange(language.code)}
              className="cursor-pointer"
            >
              <span className="mr-2">{language.flag}</span>
              <span className="flex-1">{language.name}</span>
              {selectedLanguage === language.code && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled} className="gap-2 bg-transparent">
          <Globe className="h-4 w-4" />
          <span>
            {currentLanguage.flag} {currentLanguage.name}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[280px]">
        <DropdownMenuLabel>Select Language</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {SUPPORTED_LANGUAGES.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => onLanguageChange(language.code)}
            className="cursor-pointer"
          >
            <span className="mr-2">{language.flag}</span>
            <span className="flex-1">{language.name}</span>
            {selectedLanguage === language.code && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
