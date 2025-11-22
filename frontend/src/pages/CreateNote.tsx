import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { encrypt, fileToArrayBuffer, EncryptionResult } from '../lib/encryption';
import { analyzeThreats, ThreatAnalysis } from '../lib/threatDetection';
import { createNote } from '../lib/api';
import { RiskMeter } from '../components/RiskMeter';
import { SecurityModeSelector } from '../components/SecurityModeSelector';
import { useSecurityStore } from '../store/securityStore';

type ExpiryType = 'none' | 'time' | 'views';

export function CreateNote() {
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [expiryType, setExpiryType] = useState<ExpiryType>('none');
  const [expiresIn, setExpiresIn] = useState<string>('24');
  const [expiresUnit, setExpiresUnit] = useState<'seconds' | 'minutes' | 'hours' | 'days'>('hours');
  const [maxViews, setMaxViews] = useState<string>('1');
  const [password, setPassword] = useState('');
  const [threatAnalysis, setThreatAnalysis] = useState<ThreatAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mode } = useSecurityStore();

  // Analyze threats when content changes
  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    if (newContent.trim()) {
      const analysis = analyzeThreats(newContent);
      setThreatAnalysis(analysis);

      // In strict mode, block if risk is high
      if (mode === 'strict' && analysis.riskScore >= 70) {
        setError('High-risk content detected. Please remove sensitive information before sharing.');
      } else {
        setError(null);
      }
    } else {
      setThreatAnalysis(null);
      setError(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setContent(''); // Clear text content when file is selected
      setThreatAnalysis(null);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let encryptionResult: EncryptionResult;
      let isFile = false;
      let fileName: string | null = null;
      let mimeType: string | null = null;

      // Encrypt content or file
      if (file) {
        // Check file size (limit to 9MB before encryption to account for base64 encoding overhead)
        const MAX_FILE_SIZE = 9 * 1024 * 1024; // 9MB
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size of 9MB`);
        }
        
        isFile = true;
        fileName = file.name;
        mimeType = file.type;
        const fileBuffer = await fileToArrayBuffer(file);
        encryptionResult = await encrypt(fileBuffer);

        // Analyze file name for threats
        const nameAnalysis = analyzeThreats(file.name);
        if (mode === 'strict' && nameAnalysis.riskScore >= 70) {
          throw new Error('File name contains sensitive information.');
        }
      } else {
        if (!content.trim()) {
          throw new Error('Please enter content or select a file.');
        }

        // Check threats in strict mode
        if (threatAnalysis && mode === 'strict' && threatAnalysis.riskScore >= 70) {
          throw new Error('Cannot share high-risk content in strict mode.');
        }

        encryptionResult = await encrypt(content);
      }

      // Calculate expiration time (only if time-based expiry is selected)
      let expiresAt: Date | null = null;
      if (expiryType === 'time' && expiresIn && expiresIn !== '0') {
        const value = parseInt(expiresIn);
        let milliseconds = 0;
        switch (expiresUnit) {
          case 'seconds':
            milliseconds = value * 1000;
            break;
          case 'minutes':
            milliseconds = value * 60 * 1000;
            break;
          case 'hours':
            milliseconds = value * 60 * 60 * 1000;
            break;
          case 'days':
            milliseconds = value * 24 * 60 * 60 * 1000;
            break;
        }
        expiresAt = new Date(Date.now() + milliseconds);
      }

      // Set maxViews (only if view-based expiry is selected)
      let views = 0;
      if (expiryType === 'views') {
        views = parseInt(maxViews) || 1;
        if (views < 1) views = 1;
      }

      // Prepare request payload - log for debugging
      const payload: any = {
        encryptedData: encryptionResult.encryptedData,
        encryptedKey: encryptionResult.key, // The encryption function returns 'key', backend expects 'encryptedKey'
        iv: encryptionResult.iv,
        authTag: encryptionResult.authTag,
        maxViews: views,
        isFile,
      };

      // Include expiresAt - send null if not time-based, or ISO string if it is
      if (expiryType === 'time' && expiresAt) {
        payload.expiresAt = expiresAt.toISOString();
      } else {
        payload.expiresAt = null;
      }

      // Always include file info (null for text notes)
      payload.fileName = isFile ? (fileName || null) : null;
      payload.mimeType = isFile ? (mimeType || null) : null;

      // Include password only if provided
      const trimmedPassword = password.trim();
      if (trimmedPassword) {
        payload.password = trimmedPassword;
      }

      // Debug log
      console.log('Sending payload:', { ...payload, encryptedData: '[REDACTED]', encryptedKey: '[REDACTED]', password: payload.password ? '[REDACTED]' : undefined });

      // Store encrypted note
      const response = await createNote(payload);

      // Navigate to success page with note info
      navigate('/created', {
        state: {
          noteId: response.id,
          encryptionKey: encryptionResult.key,
          password: password.trim() || null,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create note');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-terminal-bg border-2 border-terminal-green rounded-lg p-8 font-mono">
        <h1 className="text-3xl font-bold text-terminal-green mb-2">
          &gt; CREATE SECURE NOTE
        </h1>
        <p className="text-white mb-6">
          All content is encrypted on your device before being sent. The server never sees unencrypted data.
        </p>

        <SecurityModeSelector />

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Content Input */}
          <div>
            <label className="block text-sm font-medium text-terminal-green mb-2">
              Content (Text or File)
            </label>
            <div className="space-y-4">
              {/* Text Input */}
              <textarea
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Enter your note here... All content is encrypted before sending."
                className="w-full h-48 px-4 py-3 bg-terminal-bg border-2 border-terminal-green text-white rounded-md focus:ring-2 focus:ring-terminal-green focus:border-terminal-green-bright resize-none placeholder-terminal-green-dark"
                disabled={!!file}
              />

              {/* File Input */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-3 border-2 border-dashed border-terminal-green rounded-md hover:border-terminal-green-bright transition-colors text-white"
                >
                  {file ? `SELECTED: ${file.name}` : 'SELECT FILE TO UPLOAD'}
                </button>
                {file && (
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="mt-2 text-sm text-terminal-green hover:text-terminal-green-bright"
                  >
                    &gt; REMOVE FILE
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Threat Analysis */}
          {threatAnalysis && content && (
            <RiskMeter analysis={threatAnalysis} />
          )}

          {/* Auto-masked Content Preview (if high risk) */}
          {threatAnalysis?.maskedContent && content && (
            <div className="bg-terminal-bg border-2 border-terminal-green-dim rounded-md p-4">
              <p className="text-sm font-medium text-terminal-green-bright mb-2">
                &gt; MASKED PREVIEW (Sensitive data hidden):
              </p>
              <pre className="text-sm text-terminal-green whitespace-pre-wrap bg-terminal-bg p-3 rounded border border-terminal-green font-mono">
                {threatAnalysis.maskedContent}
              </pre>
            </div>
          )}

          {/* Password Protection */}
          <div>
            <label className="block text-sm font-medium text-terminal-green mb-2">
              Password Protection (Optional)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter a password to protect this note"
              className="w-full px-4 py-2 bg-terminal-bg border-2 border-terminal-green text-white rounded-md focus:ring-2 focus:ring-terminal-green placeholder-terminal-green-dark"
            />
            <p className="mt-1 text-xs text-white">
              The note will require this password to be viewed
            </p>
          </div>

          {/* Expiry Settings */}
          <div>
            <label className="block text-sm font-medium text-terminal-green mb-3">
              Self-Destruct Settings
            </label>
            <div className="space-y-4">
              {/* Radio buttons for expiry type */}
              <div className="flex gap-6">
                <label className="flex items-center text-white cursor-pointer">
                  <input
                    type="radio"
                    name="expiryType"
                    value="none"
                    checked={expiryType === 'none'}
                    onChange={(e) => setExpiryType(e.target.value as ExpiryType)}
                    className="mr-2 accent-terminal-green"
                  />
                  <span>No expiry</span>
                </label>
                <label className="flex items-center text-white cursor-pointer">
                  <input
                    type="radio"
                    name="expiryType"
                    value="time"
                    checked={expiryType === 'time'}
                    onChange={(e) => setExpiryType(e.target.value as ExpiryType)}
                    className="mr-2 accent-terminal-green"
                  />
                  <span>Time-based</span>
                </label>
                <label className="flex items-center text-white cursor-pointer">
                  <input
                    type="radio"
                    name="expiryType"
                    value="views"
                    checked={expiryType === 'views'}
                    onChange={(e) => setExpiryType(e.target.value as ExpiryType)}
                    className="mr-2 accent-terminal-green"
                  />
                  <span>View-based</span>
                </label>
              </div>

              {/* Time-based expiry inputs */}
              {expiryType === 'time' && (
                <div className="ml-6 border-l-2 border-terminal-green pl-4">
                  <label className="block text-sm text-terminal-green-dim mb-2">
                    Expires After
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={expiresIn}
                      onChange={(e) => setExpiresIn(e.target.value)}
                      min="1"
                      className="flex-1 px-4 py-2 bg-terminal-bg border-2 border-terminal-green text-terminal-green rounded-md focus:ring-2 focus:ring-terminal-green"
                      required
                    />
                    <select
                      value={expiresUnit}
                      onChange={(e) => setExpiresUnit(e.target.value as 'seconds' | 'minutes' | 'hours' | 'days')}
                      className="px-4 py-2 bg-terminal-bg border-2 border-terminal-green text-terminal-green rounded-md focus:ring-2 focus:ring-terminal-green"
                    >
                      <option value="seconds">Seconds</option>
                      <option value="minutes">Minutes</option>
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                    </select>
                  </div>
                </div>
              )}

              {/* View-based expiry inputs */}
              {expiryType === 'views' && (
                <div className="ml-6 border-l-2 border-terminal-green pl-4">
                  <label className="block text-sm text-terminal-green-dim mb-2">
                    Max Views (will self-destruct after this many views)
                  </label>
                  <input
                    type="number"
                    value={maxViews}
                    onChange={(e) => setMaxViews(e.target.value)}
                    min="1"
                    className="w-full px-4 py-2 bg-terminal-bg border-2 border-terminal-green text-terminal-green rounded-md focus:ring-2 focus:ring-terminal-green"
                    required
                  />
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-terminal-bg border-2 border-terminal-green rounded-md p-4">
              <p className="text-sm text-terminal-green-bright">&gt; ERROR: {error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || (mode === 'strict' && threatAnalysis && threatAnalysis.riskScore >= 70) || (!content.trim() && !file)}
            className="w-full bg-terminal-green-dark border-2 border-terminal-green text-white py-3 px-6 rounded-md font-medium hover:bg-terminal-green hover:text-terminal-bg disabled:border-terminal-green-dark disabled:text-terminal-green-dark disabled:cursor-not-allowed transition-colors font-mono"
          >
            {loading ? 'ENCRYPTING AND UPLOADING...' : 'CREATE SECURE NOTE'}
          </button>
        </form>
      </div>
    </div>
  );
}
