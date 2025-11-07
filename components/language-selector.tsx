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
  { code: "en-US", name: "English (US)", flag: "🇺🇸" },
  { code: "en-GB", name: "English (UK)", flag: "🇬🇧" },
  { code: "es-ES", name: "Spanish", flag: "🇪🇸" },
  { code: "fr-FR", name: "French", flag: "🇫🇷" },
  { code: "de-DE", name: "German", flag: "🇩🇪" },
  { code: "pt-PT", name: "Portuguese", flag: "🇵🇹" },
  { code: "it-IT", name: "Italian", flag: "🇮🇹" },
  { code: "nl-NL", name: "Dutch", flag: "🇳🇱" },
  { code: "ar-SA", name: "Arabic", flag: "🇸🇦" },
  { code: "zh-CN", name: "Chinese (Simplified)", flag: "🇨🇳" },
  { code: "ja-JP", name: "Japanese", flag: "🇯🇵" },
  { code: "ko-KR", name: "Korean", flag: "🇰🇷" },
  { code: "hi-IN", name: "Hindi", flag: "🇮🇳" },
  { code: "ru-RU", name: "Russian", flag: "🇷🇺" },
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
        <DropdownMenuContent align="end" className="max-h-[400px] w-[280px] overflow-y-auto">
          <DropdownMenuLabel>Select Language</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="space-y-1">
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              South African Languages
            </DropdownMenuLabel>
            {SUPPORTED_LANGUAGES.filter((lang) => lang.code.endsWith("-ZA")).map((language) => (
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
          </div>
          <DropdownMenuSeparator />
          <div className="space-y-1">
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Other Languages</DropdownMenuLabel>
            {SUPPORTED_LANGUAGES.filter((lang) => !lang.code.endsWith("-ZA")).map((language) => (
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
          </div>
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
      <DropdownMenuContent align="end" className="max-h-[400px] w-[280px] overflow-y-auto">
        <DropdownMenuLabel>Select Language</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="space-y-1">
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
            South African Languages
          </DropdownMenuLabel>
          {SUPPORTED_LANGUAGES.filter((lang) => lang.code.endsWith("-ZA")).map((language) => (
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
        </div>
        <DropdownMenuSeparator />
        <div className="space-y-1">
          <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Other Languages</DropdownMenuLabel>
          {SUPPORTED_LANGUAGES.filter((lang) => !lang.code.endsWith("-ZA")).map((language) => (
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
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
