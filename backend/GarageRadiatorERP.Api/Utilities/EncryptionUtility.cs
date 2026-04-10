using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;

namespace GarageRadiatorERP.Api.Utilities
{
    public interface IEncryptionUtility
    {
        string Encrypt(string plainText);
        string Decrypt(string cipherText);
    }

    public class EncryptionUtility : IEncryptionUtility
    {
        private readonly byte[] _key;

        public EncryptionUtility(Microsoft.Extensions.Configuration.IConfiguration configuration)
        {
            var configKey = configuration["Encryption:SecretKey"];
            var envKey = Environment.GetEnvironmentVariable("ERP_ENCRYPTION_KEY");
            var keyToUse = !string.IsNullOrEmpty(envKey) ? envKey : configKey;

            if (string.IsNullOrEmpty(keyToUse) || keyToUse.Length != 32)
            {
                throw new InvalidOperationException("Mising or invalid Encryption Key (must be 32 chars).");
            }
            _key = Encoding.UTF8.GetBytes(keyToUse);
        }

        public string Encrypt(string plainText)
        {
            if (string.IsNullOrEmpty(plainText)) return plainText;

            using Aes aes = Aes.Create();
            aes.Key = _key;
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

        public string Decrypt(string cipherText)
        {
            if (string.IsNullOrEmpty(cipherText)) return cipherText;

            try
            {
                byte[] fullCipher = Convert.FromBase64String(cipherText);

                using Aes aes = Aes.Create();
                aes.Key = _key;

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
