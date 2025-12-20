import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "frontend/src/components/ui/select";
import { SUPPORTED_LANGUAGES } from "../../i18n";

interface Props {
  className?: string;
}

export function LanguageSelector({ className = "" }: Props) {
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (value: string) => {
    i18n.changeLanguage(value);
  };

  return (
    <div className={className}>
      <Select value={i18n.language} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-[140px] !text-black dark:!text-white">
          <SelectValue placeholder={t("common.languageSelector")} />
        </SelectTrigger>
        <SelectContent>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              {t(`languages.${lang.code}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
