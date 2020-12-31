using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace Stocky
{
    class MainPassword
    {
        private static string path = "hard.txt";
        private static int saltLenght = 12;
        private static string defaultPassword = "1234";

        private static byte[] GetSalt()
        {
            byte[] salt;
            new RNGCryptoServiceProvider().GetBytes(salt = new byte[saltLenght]);
            return salt;
        }

        private static byte[] Hash(string password, byte[] salt)
        {

            var pbkdf2 = new Rfc2898DeriveBytes(password, salt, 100000);
            byte[] hash = pbkdf2.GetBytes(20);

            byte[] hashBytes = new byte[20 + saltLenght];
            Array.Copy(salt, 0, hashBytes, 0, saltLenght);
            Array.Copy(hash, 0, hashBytes, saltLenght, 20);

            return hashBytes;
        }

        public static byte[] Hash(string password)
        {
            return Hash(password, new byte[] { 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120 });
        }

        public static string GetHashPwd()
        {
            if (!File.Exists(path))
                FirstSavePassword(defaultPassword);

            StreamReader reader = new StreamReader(path);
            string str = reader.ReadToEnd();
            reader.Close();
            
            return str;
        }

        private static void FirstSavePassword(string password)
        {
            byte[] salt = GetSalt();
            string savedPasswordHash = Convert.ToBase64String(Hash(password, salt));

            if (!File.Exists(path))
            {
                FileStream f = File.Create(path);
                f.Close();
            }

            StreamWriter writer = new StreamWriter(path);
            writer.Write(savedPasswordHash);
            writer.Close();
        }

        public static void SavePassword(string currentPassword, string newPassword)
        {

            Aes aes = Aes.Create();
            aes.Key = Hash(currentPassword);
            XmlHandler.Decrypt(aes);
            aes.Key = Hash(newPassword);
            XmlHandler.Encrypt(aes);
            aes.Clear();

            byte[] salt = GetSalt();
            string savedPasswordHash = Convert.ToBase64String(Hash(newPassword,salt));
            StreamWriter writer = new StreamWriter(path);
            writer.Write(savedPasswordHash);
            writer.Close();
        }

        public static bool IsPasswordValid(string password)
        {
            byte[] currentPassword = Convert.FromBase64String(GetHashPwd());

            byte[] salt = new byte[saltLenght];
            Array.Copy(currentPassword, 0, salt, 0, saltLenght);
            byte[] newPassword = Hash(password,salt);

            for (int i = saltLenght; i < saltLenght + 20; i++)
                if (currentPassword[i] != newPassword[i])
                    return false;
            return true;
        }

        

    
    }
}
