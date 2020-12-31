using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Shapes;
using System.Xml.Serialization;

namespace Stocky
{
    public partial class SettingsWindow : Window
    {
        
        public SettingsWindow()
        {
            InitializeComponent();
        }
        private void bt_save_id1_Click(object sender, RoutedEventArgs e)
        {
            MainWindow.id_user1 = tBox_id1.Text;
            SaveIds();
            tBox_id1.Text = "";
        }

        private void bt_save_id2_Click(object sender, RoutedEventArgs e)
        {
            MainWindow.id_user2 = tBox_id2.Text;
            SaveIds();
            tBox_id2.Text = "";
        }

        private void SaveIds()
        {
            StreamWriter writer = new StreamWriter("ids.txt");
            writer.WriteLine(MainWindow.id_user1);
            writer.WriteLine(MainWindow.id_user2);
            writer.Close();
        }

        private void bt_save_mdp_Click(object sender, RoutedEventArgs e)
        {
            if (tBox_newMdp1.Password.Equals(tBox_newMdp2.Password))
            {
                if (MainPassword.IsPasswordValid(tBox_currMdp.Password))
                {
                    MainPassword.SavePassword(tBox_currMdp.Password, tBox_newMdp1.Password);
                    tBox_newMdp1.Password = "";
                    tBox_newMdp2.Password = "";
                    tBox_currMdp.Password = "";
                }
                else
                {
                    tBlock_saisi.Opacity = 1;
                    tBlock_saisi.Text = "Mot de passe actuel incorrect";
                }
            }
            else
            {
                tBlock_saisi.Opacity = 1;
                tBlock_saisi.Text = "Erreur dans la saisi du nouveau mot de passe";
            }
        }

        private void bt_quit_Click(object sender, RoutedEventArgs e)
        {
            this.Close();
        }

        private void bt_sauvegarde_Click(object sender, RoutedEventArgs e)
        {
            Aes aes = Aes.Create();
            aes.Key = MainPassword.Hash(MainWindow.MainPass);
            XmlHandler.Sauvegarder(aes);
            aes.Clear();
        }

        private void bt_import_Click(object sender, RoutedEventArgs e)
        {
            ObservableCollection<Element> importedElements = new ObservableCollection<Element>();
            XmlSerializer x = new XmlSerializer(importedElements.GetType());
            StreamReader reader = new StreamReader("import.xml");
            importedElements = (ObservableCollection<Element>) x.Deserialize(reader);
            reader.Close();
            foreach(Element el in importedElements)
            {
                MainWindow.elements.Add(el);
            }            
        }
    }
}
