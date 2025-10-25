import fs from "fs";
import path from "path";
import { promisify } from "util";

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);

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

export async function deleteFile(storageUrl: string): Promise<void> {
  const fileName = storageUrl.replace("/files/", "");
  const filePath = path.join(process.cwd(), PRIVATE_OBJECT_DIR, "documents", fileName);
  
  try {
    await unlink(filePath);
  } catch (error) {
    console.error(`Failed to delete file ${fileName}:`, error);
  }
}
