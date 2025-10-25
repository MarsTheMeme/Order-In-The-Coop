import fs from "fs";
import path from "path";
import { promisify } from "util";

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

const PRIVATE_OBJECT_DIR = process.env.PRIVATE_OBJECT_DIR || ".private";

export async function uploadFile(file: Express.Multer.File): Promise<string> {
  const uploadDir = path.join(process.cwd(), PRIVATE_OBJECT_DIR, "documents");
  
  await mkdir(uploadDir, { recursive: true });

  const fileName = `${Date.now()}-${file.originalname}`;
  const filePath = path.join(uploadDir, fileName);

  await writeFile(filePath, file.buffer);

  return `/files/${fileName}`;
}

export async function getFileUrl(fileName: string): Promise<string> {
  return `/files/${fileName}`;
}
