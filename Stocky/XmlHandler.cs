using System;
using System.Xml;
using System.Security.Cryptography;
using System.Security.Cryptography.Xml;
using System.IO;
using System.Xml.Serialization;
using System.Diagnostics;
using System.Collections.ObjectModel;
using System.Runtime.InteropServices.ComTypes;
using System.Windows.Media;
using System.Security.AccessControl;
using System.Windows.Documents;
using Microsoft.Win32;

namespace Stocky
{

    class XmlHandler
    {
        private static string TAG = "Debug: XmlHandler: ";
        private static string path = "elements.xml";
        private static string ElementName = "ArrayOfElement";
        public static XmlDocument Doc { get; set; }

        public static void CreateFile()
        {
            if (!File.Exists(path))
            {
                FileStream f = File.Create(path);
                f.Close();
                SerializeElements(new ObservableCollection<Element>());
            }
        }

        public static void LoadXmlDocument()
        {
            Doc = new XmlDocument();
            Doc.PreserveWhitespace = true;
            Doc.Load(path);
        }

        public static void SerializeElements<T>(T elements)
        {
            XmlSerializer x = new XmlSerializer(elements.GetType());
            StreamWriter writer = new StreamWriter(path);
            x.Serialize(writer, elements);
            writer.Close();
        }

        public static T DeserializeElements<T>(T elements)
        {
            XmlSerializer x = new XmlSerializer(elements.GetType());
            StreamReader reader = new StreamReader(path);
            T objects = (T) x.Deserialize(reader);
            reader.Close();
            return objects;
        }

        public static T GetElements<T>(T elements, SymmetricAlgorithm AlgKey)
        {
            Decrypt(AlgKey);
            T objects = DeserializeElements(elements);
            Encrypt(AlgKey);
            return objects;
        }

        public static void Encrypt(SymmetricAlgorithm Key)
        {
            LoadXmlDocument();

            // Check the arguments.
            if (Doc == null)
                throw new ArgumentNullException("Doc");
            if (ElementName == null)
                throw new ArgumentNullException("ElementToEncrypt");
            if (Key == null)
                throw new ArgumentNullException("Alg");

            // Find the specified element in the XmlDocument object and create a new XmlElement object.
            XmlElement elementToEncrypt = Doc.GetElementsByTagName(ElementName)[0] as XmlElement;

            // Throw an XmlException if the element was not found.
            if (elementToEncrypt == null)
            {
                mDebug("ERROR Encrypt elementToEncrypt==null");
                //throw new XmlException("The specified element was not found");
                return;
            }

            // Create a new instance of the EncryptedXml and use it to encrypt the XmlElement with symmetric key.
            EncryptedXml eXml = new EncryptedXml();

            byte[] encryptedElement = eXml.EncryptData(elementToEncrypt, Key, false);
            
            // Construct an EncryptedData object and populate it with the desired encryption information
            EncryptedData edElement = new EncryptedData();
            edElement.Type = EncryptedXml.XmlEncElementUrl;

            edElement.EncryptionMethod = new EncryptionMethod(EncryptedXml.XmlEncAES256Url);

            // Add the encrypted element data to the EncryptedData object.
            edElement.CipherData.CipherValue = encryptedElement;

            StreamReader reader = new StreamReader(path);
            reader.Close();

            // Replace the element from the original XmlDocument object with the EncryptedData element.
            EncryptedXml.ReplaceElement(elementToEncrypt, edElement, false);
            Doc.Save(path);
            mDebug("Encrypted");

        }

        internal static void Sauvegarder(SymmetricAlgorithm Alg)
        {
            if (!File.Exists("save.xml"))
            {
                FileStream f = File.Create("save.xml");
                f.Close();
            }
            StreamWriter writer = new StreamWriter("save.xml");
            Decrypt(Alg);
            StreamReader reader = new StreamReader(path);
            writer.Write(reader.ReadToEnd());
            reader.Close();
            writer.Close();
            Encrypt(Alg);
        }

        private static void mDebug(string msg)
        {
            Debug.WriteLine(TAG + msg);
        }

        public static void Decrypt(SymmetricAlgorithm Alg)
        {
            LoadXmlDocument();

            // Check the arguments.
            if (Doc == null)
                throw new ArgumentNullException("Doc");
            if (Alg == null)
                throw new ArgumentNullException("Alg");

            // Find the EncryptedData element in the XmlDocument.
            XmlElement encryptedElement = Doc.GetElementsByTagName("EncryptedData")[0] as XmlElement;

            // If the EncryptedData element was not found, throw an exception.
            if (encryptedElement == null)
            {
                mDebug("ERROR Decrypt elementToEncrypt==null");
                return;
            }
            
            // Create an EncryptedData object and populate it.
            EncryptedData edElement = new EncryptedData();
            edElement.LoadXml(encryptedElement);

            // Create a new EncryptedXml object.
            EncryptedXml exml = new EncryptedXml();

            // Decrypt the element using the symmetric key.
            byte[] rgbOutput = exml.DecryptData(edElement, Alg);

            // Replace the encryptedData element with the plaintext XML element.
            exml.ReplaceData(encryptedElement, rgbOutput);
            Doc.Save(path);
        }
    }
}
