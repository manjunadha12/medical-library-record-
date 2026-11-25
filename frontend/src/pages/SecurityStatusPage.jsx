import React, { useState, useEffect } from 'react';
import {
  Lock,
  Shield,
  KeyRound,
  FileCheck2,
  Cpu,
  Terminal,
  CheckCircle2,
  Copy,
  Check,
  Server,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { verifyApi, recordsApi } from '../services/api';
import { Badge } from '../components/common/Badge';
import { TamperSimulator } from '../components/common/TamperSimulator';
import { useAuth } from '../context/AuthContext';

export const SecurityStatusPage = () => {
  const { user } = useAuth();
  const [keys, setKeys] = useState(null);
  const [records, setRecords] = useState([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      const [keyRes, recRes] = await Promise.all([
        verifyApi.getKeys(),
        recordsApi.list(),
      ]);

      if (keyRes.success) setKeys(keyRes.keyMetadata);
      if (recRes.success) setRecords(recRes.records || []);
    } catch (err) {
      console.warn('Security page data error:', err.message);
    }
  };

  const handleCopyKey = () => {
    if (keys?.publicKeyPem) {
      navigator.clipboard.writeText(keys.publicKeyPem);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="crypto" size="sm">Cryptographic Verification Studio</Badge>
          <Badge variant="cyan" size="sm">Module 2 & Module 4</Badge>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Encryption & Key Management Architecture
        </h1>
        <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
          View the encryption settings and public signing keys used to protect medical records.
        </p>
      </div>

      {/* Envelope Encryption Architecture Showcase Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Envelope Encryption Design Specification
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Two-tier key hierarchy preventing master key exhaustion</p>
          </div>
          <Badge variant="primary" size="sm">Active (v1)</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider block">Tier 1: Master Key (KEK)</span>
            <p className="text-xs font-bold text-slate-900">Key Encryption Key</p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              256-bit root key stored in environment variables (simulating KMS / HSM). Used solely to wrap and unwrap ephemeral file keys.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider block">Tier 2: Data Encryption Key (DEK)</span>
            <p className="text-xs font-bold text-slate-900">Per-File Ephemeral Key</p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Unique 32-byte cryptographically secure random key generated for every upload. Never persisted in plaintext.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">Cipher Mode: AES-256-GCM</span>
            <p className="text-xs font-bold text-slate-900">Authenticated Encryption</p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              96-bit random IV and 128-bit authentication tag. Guarantees confidentiality and immediate rejection of altered ciphertext.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-brand-50/60 border border-brand-100 text-xs text-brand-900 leading-relaxed">
          <strong>Key Management Service (KMS) Architecture:</strong> The Master Key (KEK) is provisioned securely through validated environment security vaults. In enterprise environments, this maps to managed Cloud KMS (such as AWS KMS, Azure Key Vault, or HashiCorp Vault) with automated hardware-level rotation and strict access policies.
        </div>
      </div>

      {/* Public Attestation Key Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              System Digital Attestation Authority (Public Key)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Public RSA-PSS key used by any client to verify system digital signatures and document authenticity
            </p>
          </div>

          <button
            onClick={handleCopyKey}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copied PEM' : 'Copy Public Key'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-3">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Key Identifier</span>
            <span className="font-mono font-bold text-slate-800">{keys?.keyId || 'system-rsa-pss-v1'}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Signing Algorithm</span>
            <span className="font-mono font-bold text-indigo-700">{keys?.algorithm || 'RSA-PSS-SHA256'}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] text-slate-400 block uppercase font-bold">Signer Role</span>
            <span className="font-mono font-bold text-teal-700 capitalize">{keys?.signerRole || 'system'}</span>
          </div>
        </div>

        <div className="relative">
          <pre className="p-4 rounded-2xl bg-slate-900 text-slate-300 font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
            {keys?.publicKeyPem || '-----BEGIN PUBLIC KEY-----\nLoading RSA-PSS public key...\n-----END PUBLIC KEY-----'}
          </pre>
        </div>
      </div>

      {/* Live Cryptographic Integrity Test (Admin Only) */}
      {user?.role === 'admin' && records.length > 0 && (
        <TamperSimulator records={records} />
      )}
    </div>
  );
};
