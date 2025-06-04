import { ChangeEvent } from "react";
import { Upload } from "lucide-react";
import { Label } from "@/features/ui/components/ui/label";
import { Input } from "@/features/ui/components/ui/input";
import { useTranslations } from "next-intl";

interface FileUploadAreaProps {
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  id?: string;
}

const FileUploadArea: React.FC<FileUploadAreaProps> = ({ onFileChange, id = "file-upload" }) => {
  const t = useTranslations('DocumentTranslationCard');
  return (
    <Label htmlFor={id} className="w-full block h-full">
      <div className="w-full h-full border-2 border-dashed rounded-lg p-8 text-center hover:border-suliko-default-color transition-colors cursor-pointer flex flex-col items-center justify-center">
        <div className="cursor-pointer">
          <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">
            {t('dragAndDrop')}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {t('supportedFormats')}
          </p>
          <Input
            type="file"
            className="hidden"
            id={id}
            onChange={onFileChange}
          />
        </div>
      </div>
    </Label>
  );
};

export default FileUploadArea; 