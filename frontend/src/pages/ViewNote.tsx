import { useEffect, useState, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { getNote } from '../lib/api';
import { decrypt } from '../lib/encryption';

export function ViewNote() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [decryptedContent, setDecryptedContent] = useState<string | ArrayBuffer | null>(null);
  const [isFile, setIsFile] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewCount, setViewCount] = useState<number>(0);
  const [maxViews, setMaxViews] = useState<number>(0);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false); // Prevent double loading in React StrictMode

  useEffect(() => {
    // Prevent double loading in React StrictMode (development)
    if (hasLoadedRef.current) return;
    
    const loadNote = async () => {
      if (hasLoadedRef.current) return; // Additional check
      hasLoadedRef.current = true;
      
      if (!id) {
        setError('Invalid note ID');
        setLoading(false);
        return;
      }

      try {
        // Extract encryption key from URL hash
        const hash = location.hash.substring(1); // Remove #
        if (!hash) {
          setError('Encryption key not found in URL. Please use the share link provided when the note was created.');
          setLoading(false);
          return;
        }

        // Decode the hash and clean it (in case there are any query params accidentally in hash)
        let encryptionKey = decodeURIComponent(hash);
        
        // Remove any query parameters that might have been incorrectly added to hash
        const hashParts = encryptionKey.split('&');
        encryptionKey = hashParts[0]; // Take only the first part (the actual key)
        
        // Validate that it looks like base64
        if (!/^[A-Za-z0-9+/=]+$/.test(encryptionKey)) {
          throw new Error('Invalid encryption key format in URL');
        }
        
        // First, try to fetch without password to check if password is required
        // This ensures we always prompt for password even if it's in URL
        try {
          const note = await getNote(id); // Try without password first
          setIsFile(note.isFile);
          setFileName(note.fileName);
          setMimeType(note.mimeType);
          setViewCount(note.viewCount);
          setMaxViews(note.maxViews);

          // Decrypt content
          const decrypted = await decrypt(
            note.encryptedData,
            note.iv,
            note.authTag,
            encryptionKey
          );

          setDecryptedContent(decrypted);
          setLoading(false);
        } catch (err) {
          // If password is required, show password form
          if (err instanceof Error && err.message === 'PASSWORD_REQUIRED') {
            setRequiresPassword(true);
            setLoading(false);
            // Don't use password from URL automatically - always require manual entry for security
          } else {
            throw err;
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load note');
        setLoading(false);
        hasLoadedRef.current = false; // Reset on error to allow retry
      }
    };

    loadNote();
    
    // Cleanup function - reset ref when dependencies change or unmount
    return () => {
      hasLoadedRef.current = false;
    };
  }, [id, location.hash, location.search]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setLoading(true);

    if (!id) {
      setError('Invalid note ID');
      setLoading(false);
      return;
    }

    try {
      // Extract encryption key from URL hash
      const hash = location.hash.substring(1);
      if (!hash) {
        setError('Encryption key not found in URL.');
        setLoading(false);
        return;
      }

      // Decode and clean the hash
      let encryptionKey = decodeURIComponent(hash);
      
      // Remove any query parameters that might have been incorrectly added to hash
      const hashParts = encryptionKey.split('&');
      encryptionKey = hashParts[0];
      
      // Validate that it looks like base64
      if (!/^[A-Za-z0-9+/=]+$/.test(encryptionKey)) {
        throw new Error('Invalid encryption key format in URL');
      }

      // Fetch encrypted note with password
      const note = await getNote(id, password);
      setIsFile(note.isFile);
      setFileName(note.fileName);
      setMimeType(note.mimeType);
      setViewCount(note.viewCount);
      setMaxViews(note.maxViews);

      // Decrypt content
      const decrypted = await decrypt(
        note.encryptedData,
        note.iv,
        note.authTag,
        encryptionKey
      );

      setDecryptedContent(decrypted);
      setRequiresPassword(false);
      setLoading(false);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Invalid password');
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!decryptedContent || !fileName) return;

    const blob = new Blob([decryptedContent as ArrayBuffer], { type: mimeType || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Password required screen
  if (requiresPassword) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-terminal-bg border-2 border-terminal-green rounded-lg p-8 font-mono">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-terminal-green rounded-full mb-4">
              <span className="text-terminal-green text-2xl">🔒</span>
            </div>
            <h1 className="text-3xl font-bold text-terminal-green mb-2">&gt; PASSWORD REQUIRED</h1>
            <p className="text-white">This note is protected with a password.</p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="max-w-md mx-auto space-y-4">
            <div>
              <label className="block text-sm font-medium text-terminal-green mb-2">
                Enter Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-terminal-bg border-2 border-terminal-green text-white rounded-md focus:ring-2 focus:ring-terminal-green placeholder-terminal-green-dark"
                placeholder="Enter the note password"
                required
                autoFocus
              />
            </div>

            {passwordError && (
              <div className="bg-terminal-bg border-2 border-terminal-green rounded-md p-3">
                <p className="text-sm text-terminal-green-bright">&gt; ERROR: {passwordError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full bg-terminal-green-dark border-2 border-terminal-green text-terminal-bg py-3 px-6 rounded-md font-medium hover:bg-terminal-green hover:text-terminal-bg disabled:border-terminal-green-dark disabled:text-terminal-green-dark disabled:cursor-not-allowed transition-colors font-mono"
            >
              {loading ? 'VERIFYING...' : 'UNLOCK NOTE'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-terminal-bg border-2 border-terminal-green rounded-lg p-8 text-center font-mono">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terminal-green mx-auto"></div>
          <p className="mt-4 text-terminal-green">&gt; DECRYPTING NOTE...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-terminal-bg border-2 border-terminal-green rounded-lg p-8 font-mono">
          <div className="bg-terminal-bg border-2 border-terminal-green rounded-md p-4">
            <h2 className="text-lg font-semibold text-terminal-green-bright mb-2">&gt; ERROR</h2>
            <p className="text-terminal-green">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-terminal-bg border-2 border-terminal-green rounded-lg p-8 font-mono">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-terminal-green mb-2">&gt; SECURE NOTE</h1>
          <div className="flex items-center justify-between text-sm text-terminal-green-dim">
            <div>
              {maxViews > 0 ? (
                <span>
                  Views: {viewCount} / {maxViews}
                </span>
              ) : (
                <span>Views: {viewCount} (unlimited)</span>
              )}
            </div>
            {isFile && fileName && (
              <span className="text-terminal-green">&gt; {fileName}</span>
            )}
          </div>
        </div>

        {isFile ? (
          <div className="space-y-4">
            <div className="bg-terminal-bg border-2 border-terminal-green rounded-md p-6 text-center">
              <p className="text-terminal-green mb-4">
                Encrypted file: <strong>{fileName}</strong>
              </p>
              <p className="text-sm text-terminal-green-dim mb-4">
                MIME Type: {mimeType || 'Unknown'}
              </p>
              <button
                onClick={handleDownload}
                className="bg-terminal-green-dark border-2 border-terminal-green text-white px-6 py-2 rounded-md font-medium hover:bg-terminal-green hover:text-terminal-bg transition-colors font-mono"
              >
                &gt; DOWNLOAD DECRYPTED FILE
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-terminal-bg border-2 border-terminal-green rounded-md p-6">
            <pre className="whitespace-pre-wrap text-white font-mono text-sm">
              {typeof decryptedContent === 'string' ? decryptedContent : 'Binary content'}
            </pre>
          </div>
        )}

        <div className="mt-6 p-4 bg-terminal-bg border-2 border-terminal-green-dim rounded-md">
          <p className="text-sm text-white">
            &gt; WARNING: This note may self-destruct after expiration or maximum views.
            Copy any important information now.
          </p>
        </div>
      </div>
    </div>
  );
}
