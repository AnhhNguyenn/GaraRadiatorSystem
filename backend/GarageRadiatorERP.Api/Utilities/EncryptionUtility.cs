using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;

namespace GarageRadiatorERP.Api.Utilities
{
    public static class EncryptionUtility
    {
        // In a real production system, this key should be loaded from Azure KeyVault, 
        // AWS KMS, or a highly secure Environment Variable.
        // For demonstration, an environment variable fallback is provided.
        private static readonly byte[] Key = GetEncryptionKey();

        private static byte[] GetEncryptionKey()
        {
            var envKey = Environment.GetEnvironmentVariable("ERP_ENCRYPTION_KEY");
            if (!string.IsNullOrEmpty(envKey) && envKey.Length == 32)
            {
                return Encoding.UTF8.GetBytes(envKey);
            }
            
            // Fallback development key (32 bytes for AES-256)
            return Encoding.UTF8.GetBytes("GarageRadiatorSecretKey123456789");
        }

        public static string Encrypt(string plainText)
        {
            if (string.IsNullOrEmpty(plainText)) return plainText;

            using Aes aes = Aes.Create();
            aes.Key = Key;
            aes.GenerateIV(); // 16 byte IV

            using MemoryStream ms = new MemoryStream();
            // Prefix the encrypted data with the IV
            ms.Write(aes.IV, 0, aes.IV.Length);

            using (CryptoStream cs = new CryptoStream(ms, aes.CreateEncryptor(), CryptoStreamMode.Write))
            {
                byte[] plainBytes = Encoding.UTF8.GetBytes(plainText);
                cs.Write(plainBytes, 0, plainBytes.Length);
            }

            return Convert.ToBase64String(ms.ToArray());
        }

        public static string Decrypt(string cipherText)
        {
            if (string.IsNullOrEmpty(cipherText)) return cipherText;

            try
            {
                byte[] fullCipher = Convert.FromBase64String(cipherText);

                using Aes aes = Aes.Create();
                aes.Key = Key;
                
                // Extract IV from the first 16 bytes
                var iv = new byte[16];
                Array.Copy(fullCipher, 0, iv, 0, iv.Length);
                aes.IV = iv;

                using MemoryStream ms = new MemoryStream();
                using (CryptoStream cs = new CryptoStream(new MemoryStream(fullCipher, 16, fullCipher.Length - 16), aes.CreateDecryptor(), CryptoStreamMode.Read))
                {
                    cs.CopyTo(ms);
                }

                return Encoding.UTF8.GetString(ms.ToArray());
            }
            catch (Exception)
            {
                // Return original text if decryption fails (e.g., legacy unencrypted tokens)
                return cipherText;
            }
        }
    }
}
