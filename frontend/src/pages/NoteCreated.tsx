import { QRCodeSVG } from 'qrcode.react';
import { useLocation, Link } from 'react-router-dom';

export function NoteCreated() {
  const location = useLocation();
  const { noteId, encryptionKey, password } = location.state || {};

  if (!noteId || !encryptionKey) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-terminal-bg border-2 border-terminal-green rounded-lg p-8 font-mono">
          <div className="bg-terminal-bg border-2 border-terminal-green rounded-md p-4">
            <h2 className="text-lg font-semibold text-terminal-green-bright mb-2">&gt; ERROR</h2>
            <p className="text-terminal-green">Missing note information. Please create a new note.</p>
            <Link to="/" className="text-terminal-green hover:text-terminal-green-bright mt-4 inline-block">
              &lt; Back to Create Note
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Construct the full URL
  const baseUrl = window.location.origin;
  // Query string must come BEFORE hash in URLs
  // Format: /note/{id}?password=xxx#encryptionKey
  let noteUrl = `${baseUrl}/note/${noteId}`;
  if (password) {
    noteUrl += `?password=${encodeURIComponent(password)}`;
  }
  noteUrl += `#${encodeURIComponent(encryptionKey)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(noteUrl);
    alert('Link copied to clipboard!');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-terminal-bg border-2 border-terminal-green rounded-lg p-8 font-mono">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-terminal-green rounded-full mb-4">
            <span className="text-terminal-green text-2xl">✓</span>
          </div>
          <h1 className="text-3xl font-bold text-terminal-green mb-2">
            &gt; NOTE CREATED SUCCESSFULLY
          </h1>
          <p className="text-white">
            Your secure note is ready. Share the link or QR code below.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* QR Code */}
          <div className="bg-terminal-bg border-2 border-terminal-green rounded-lg p-6 flex flex-col items-center">
            <h3 className="text-lg font-semibold text-terminal-green mb-4">&gt; QR CODE</h3>
            <div className="bg-terminal-bg p-4 rounded-lg border-2 border-terminal-green mb-4">
              <QRCodeSVG value={noteUrl} size={200}  />
            </div>
            <p className="text-sm text-white text-center">
              Scan with your phone to open the note
            </p>
          </div>

          {/* Share Link */}
          <div className="bg-terminal-bg border-2 border-terminal-green rounded-lg p-6">
            <h3 className="text-lg font-semibold text-terminal-green mb-4">&gt; SHARE LINK</h3>
            <div className="space-y-4">
              <div className="bg-terminal-bg border-2 border-terminal-green rounded-md p-3 break-all">
                <p className="text-sm text-white font-mono">{noteUrl}</p>
              </div>
              <button
                onClick={handleCopyLink}
                className="w-full bg-terminal-green-dark border-2 border-terminal-green text-terminal-bg py-2 px-4 rounded-md font-medium hover:bg-terminal-green hover:text-terminal-bg transition-colors font-mono"
              >
                &gt; COPY LINK
              </button>
              {password && (
                <div className="bg-terminal-bg border-2 border-terminal-green-dim rounded-md p-3">
                  <p className="text-sm text-terminal-green-bright">
                    &gt; WARNING: Share the password separately: <code className="font-mono bg-terminal-bg px-2 py-1 rounded border border-terminal-green text-terminal-green">{password}</code>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-terminal-bg border-2 border-terminal-green rounded-md p-4 mb-6">
          <h4 className="text-sm font-semibold text-terminal-green mb-2">&gt; SECURITY INFORMATION</h4>
          <ul className="text-sm text-white space-y-1 list-disc list-inside">
            <li>The encryption key is included in the link</li>
            <li>Anyone with the link can decrypt the note</li>
            <li>{password ? 'The note is also protected with a password' : 'Consider adding a password for extra security'}</li>
            <li>The note will self-destruct after expiration or max views</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <Link
            to="/"
            className="px-6 py-2 border-2 border-terminal-green rounded-md text-white hover:bg-terminal-green-dark hover:text-terminal-bg transition-colors font-mono"
          >
            &gt; CREATE ANOTHER NOTE
          </Link>
          <a
            href={noteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2 bg-terminal-green-dark border-2 border-terminal-green text-terminal-bg rounded-md hover:bg-terminal-green hover:text-terminal-bg transition-colors font-mono"
          >
            &gt; VIEW NOTE
          </a>
        </div>
      </div>
    </div>
  );
}
