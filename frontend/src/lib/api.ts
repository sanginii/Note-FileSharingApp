const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";
// url
export interface CreateNoteRequest {
  encryptedData: string;
  encryptedKey: string;
  iv: string;
  authTag: string;
  expiresAt?: string | null;
  maxViews?: number;
  isFile?: boolean;
  fileName?: string | null;
  mimeType?: string | null;
  password?: string;
}

export interface CreateNoteResponse {
  id: string;
  createdAt: string;
}

export interface NoteResponse {
  encryptedData: string;
  encryptedKey: string;
  iv: string;
  authTag: string;
  isFile: boolean;
  fileName: string | null;
  mimeType: string | null;
  viewCount: number;
  maxViews: number;
}

/**
 * Create a new encrypted note
 */
export async function createNote(
  data: CreateNoteRequest
): Promise<CreateNoteResponse> {
  const response = await fetch(`${API_BASE_URL}/notes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: "Failed to create note" }));

    // If there are validation details, include them in the error
    if (errorData.details && Array.isArray(errorData.details)) {
      const details = errorData.details
        .map((d: any) => `${d.path.join(".")}: ${d.message}`)
        .join(", ");
      throw new Error(
        `${errorData.error || "Invalid request data"}: ${details}`
      );
    }

    throw new Error(errorData.error || "Failed to create note");
  }

  return response.json();
}

/**
 * Get an encrypted note by ID
 */
export async function getNote(
  id: string,
  password?: string
): Promise<NoteResponse> {
  const url = new URL(`${API_BASE_URL}/notes/${id}`);
  if (password) {
    url.searchParams.append("password", password);
  }
  const response = await fetch(url.toString());

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Note not found");
    }
    if (response.status === 401) {
      const data = await response.json().catch(() => ({}));
      if (data.requiresPassword) {
        throw new Error("PASSWORD_REQUIRED");
      }
      throw new Error("Invalid password");
    }
    if (response.status === 410) {
      throw new Error("Note has expired or been destroyed");
    }
    const error = await response
      .json()
      .catch(() => ({ error: "Failed to fetch note" }));
    throw new Error(error.error || "Failed to fetch note");
  }

  return response.json();
}

/**
 * Delete a note by ID
 */
export async function deleteNote(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete note");
  }
}
