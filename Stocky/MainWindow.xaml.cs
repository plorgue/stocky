using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Diagnostics;
using System.IO;
using System.Security.Cryptography;
using System.Security.Policy;
using System.Text;
using System.Timers;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Animation;

namespace Stocky
{
    public partial class MainWindow : Window
    {
        private Dictionary<string, string> hints = new Dictionary<string, string>();
        private Element elementSelected;
        private double delaiLockMillis = 3 * 60 * 1000;
        private bool modif = false;
        private string lght = "10";
        private bool verrouAuto = true;
        internal static string MainPass;
        private Aes aes;
        private SettingsWindow settingsWindow = new SettingsWindow();

        private ThicknessAnimation apparritionMessage = new ThicknessAnimation(new Thickness(0, 0, -240, 65), new Thickness(0, 0, 65, 65), new Duration(TimeSpan.FromMilliseconds(500)));
        private ThicknessAnimation disparitionMessage = new ThicknessAnimation(new Thickness(0, 0, 65, 65), new Thickness(0, 0, -240, 65), new Duration(TimeSpan.FromMilliseconds(400)));
        Timer timer = new Timer(5000);

        public static ObservableCollection<Element> elements { get; set; }
        public static string id_user1 { get; set; }
        public static string id_user2 { get; set; }

        public MainWindow()
        {
            InitializeComponent();
            elements = new ObservableCollection<Element>();
            DataContext = this;

            XmlHandler.CreateFile();

            LoadIds();

            InitHintDictionnary();

            Lock();
        }

        private void InitHintDictionnary()
        {
            hints.Add("tBoxAdd_title", "Titre");
            hints.Add("tBoxAdd_id", "Identifiant");
            hints.Add("tBoxAdd_link", "Lien");
            hints.Add("tBoxAdd_mdp", "Mot de passe");
            hints.Add("tBoxAdd_com", "Commentaire");
            hints.Add("tBoxAdd_search", "Mots clés");
        }

        // Events
        private void tBoxAdd_Com_GotFocus(object sender, RoutedEventArgs e)
        {
            TextBox textBox = (sender as TextBox);
            if (textBox.Text.Equals(hints[textBox.Name]))
            {
                textBox.Text = "";
                textBox.Foreground = new SolidColorBrush(Color.FromRgb(255, 255, 255));
            }
        }

        private void tBoxAdd_Com_LostFocus(object sender, RoutedEventArgs e)
        {
            TextBox textBox = (sender as TextBox);
            if (textBox.Text.Equals(""))
            {
                textBox.Text = hints[textBox.Name];
                textBox.Foreground = new SolidColorBrush(Color.FromRgb(119, 119, 119));
            }
        }

        private void bt_addMdp_Click(object sender, RoutedEventArgs e)
        {
            AjouterElement(tBoxAdd_title.Text, tBoxAdd_link.Text, tBoxAdd_id.Text, tBoxAdd_mdp.Text, tBoxAdd_com.Text);
            ElementsChanged();
            ClearAddBoxes();
        }

        private void bt_genMdp_Click(object sender, RoutedEventArgs e)
        {
            string min = "azertyuiopqsdfghjklmwxcvbn";
            string maj = "AZERTYUIOPQSDFGHJKLMWXCVBN";
            string spe = "~!@#$%^&*_-+='|\\(){}[]:;\"'<>,.?/";
            string chiffre = "12345678901234567890";

            StringBuilder carac = new StringBuilder();
            if ((bool)checkB_maj.IsChecked) carac.Append(maj);
            if ((bool)checkB_ch.IsChecked) carac.Append(chiffre);
            if ((bool)checkB_spe.IsChecked) carac.Append(spe);
            if ((bool)checkB_min.IsChecked) carac.Append(min);
            if (carac.Length == 0) return;

            StringBuilder pwd = new StringBuilder();
            int lenght = int.Parse(tBox_lenght.Text);
            Random r = new Random();
            for (int i = 0; i < lenght; i++)
                pwd.Append(carac.ToString()[r.Next(0, carac.Length - 1)]);

            tBoxAdd_mdp.Text = pwd.ToString();
            tBoxAdd_mdp.Foreground = new SolidColorBrush(Color.FromRgb(255, 255, 255));
        }

        private void bt_id1_Click(object sender, RoutedEventArgs e)
        {
            tBoxAdd_id.Text = id_user1;
            tBoxAdd_id.Foreground = new SolidColorBrush(Color.FromRgb(255, 255, 255));
        }

        private void bt_id2_Click(object sender, RoutedEventArgs e)
        {
            tBoxAdd_id.Text = id_user2;
            tBoxAdd_id.Foreground = new SolidColorBrush(Color.FromRgb(255, 255, 255));
        }

        private void bt_verou_Click(object sender, RoutedEventArgs e)
        {
            Button bt_verrou = (sender as Button);
            if (verrouAuto)
            {
                verrouAuto = false;
                bt_verrou.Content = "Vérouillage AUTO: NON";
            }
            else
            {
                verrouAuto = true;
                bt_verrou.Content = "Vérouillage AUTO: OUI";
                LunchTimer(); ///TODO: géré le spam 
            }
        }

        private void bt_settings_Click(object sender, RoutedEventArgs e)
        {
            if (!settingsWindow.IsVisible)
            {
                settingsWindow = new SettingsWindow();
            }
            settingsWindow.ShowDialog();
        }

        private void bt_modify_Click(object sender, RoutedEventArgs e)
        {
            if (elementSelected == null) return;
            if (modif)
            {
                elements.Remove(elementSelected);
                AjouterElement(tBoxShow_title.Text, tBoxShow_link.Text, tBoxShow_id.Text, tBoxShow_mdp.Text, tBoxShow_com.Text);
                ElementsChanged();
                EnableShowBox(false);
                ClearShowBoxes();
                modif = false;
                bt_suppr.IsEnabled = true;
            }
            else
            {
                EnableShowBox(true);
                modif = true;
                bt_suppr.IsEnabled = false;
            }
        }

        private void bt_suppr_Click(object sender, RoutedEventArgs e)
        {
            if (elementSelected != null)
            {
                elements.Remove(elementSelected);
                ElementsChanged();
                ClearShowBoxes();
            }
        }

        private void tBox_lenght_TextChanged(object sender, TextChangedEventArgs e)
        {
            TextBox tb = (sender as TextBox);
            int.TryParse(tb.Text, out int lenght);
            if (lenght == 0 && tb.Text != "") tb.Text = lght;
            else lght = tb.Text;
        }

        private void liste_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            elementSelected = ((sender as ListView).SelectedItem as Element);
            if (elementSelected == null) return;
            tBoxShow_title.Text = elementSelected.Titre;
            tBoxShow_link.Text = elementSelected.Lien;
            tBoxShow_mdp.Text = elementSelected.MotDePasse;
            tBoxShow_com.Text = elementSelected.Commentaire;
            tBoxShow_id.Text = elementSelected.Identifiant;
            ClipText(elementSelected.MotDePasse);
        }

        private void PasswordBox_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.Key == Key.Enter)
                EnterMainPassword();
        }

        private void bt_entrer_Click(object sender, RoutedEventArgs e) => EnterMainPassword();

        private void tBoxAdd_search_TextChanged(object sender, TextChangedEventArgs e)
        {
            if (elements != null)
            {
                string search = (sender as TextBox).Text;
                List<Element> elementsSearch = new List<Element>();
                foreach (Element elem in elements)
                    if (elem.Titre.ToLower().Contains(search) || elem.Lien.ToLower().Contains(search))
                        elementsSearch.Add(elem);
                elementsSearch.Sort();
                ObservableCollection<Element> elementsSearchSorted = new ObservableCollection<Element>(elementsSearch);
                liste.ItemsSource = elementsSearch;
                if (!(sender as TextBox).IsFocused && search == "Mots clés")
                    liste.ItemsSource = elements;
            }
        }

        private void tBoxShow_MouseDoubleClick(object sender, MouseButtonEventArgs e)
        {
            TextBox textBox = sender as TextBox;
            if (textBox.Text.Length > 0)
                ClipText(textBox.Text);
        }

        private void tBox_mainPwd_PasswordChanged(object sender, RoutedEventArgs e)
        {
            tBlock_saisi_errer.Opacity = 0;
        }

        // Méthodes
        protected override void OnClosed(EventArgs e)
        {
            base.OnClosed(e);
            
            Application.Current.Shutdown();
        }

        private void EnterMainPassword()
        {
            PasswordBox pwdBox = tBox_mainPwd;

            if (MainPassword.IsPasswordValid(pwdBox.Password))
            {
                tBlock_saisi_errer.Opacity = 0;
                MainPass = pwdBox.Password;
                Unlock();
                LunchTimer();
                pwdBox.Password = "";
            }
            else
            {
                tBlock_saisi_errer.Opacity = 1;
            }
        }
        
        private void LockTimer(object sender, ElapsedEventArgs e)
        {
            if (verrouAuto)
                Dispatcher.Invoke(() => Lock());
        }

        private void LunchTimer()
        {
            Timer timer = new Timer(delaiLockMillis);
            timer.Elapsed += LockTimer;
            timer.AutoReset = false;
            timer.Enabled = true;
        }

        private void AjouterElement(string titre, string lien, string id, string mdp, string com)
        {
            if (titre.Equals("Titre") || titre.Equals("") || mdp.Equals("Mot de passe") || mdp.Equals("")) { Debug.WriteLine("Pas assez d'information: Titre=" + titre.Equals("Titre") + " Mdp:" + mdp.Equals("Mot de passe")); return; }

            List<Element> eListe = new List<Element>(elements);

            eListe.Add(new Element(
                titre,
                lien.Equals("Lien") ? "" : lien,
                id.Equals("Identifiant") ? "" : id,
                mdp,
                com.Equals("Commentaire") ? "" : com));
            
            eListe.Sort();

            elements = new ObservableCollection<Element>(eListe);

            ClipText(mdp);
        }

        private void ElementsChanged()
        {
            aes = Aes.Create();
            aes.Key = MainPassword.Hash(MainPass);
            XmlHandler.Decrypt(aes);
            XmlHandler.SerializeElements(elements);
            XmlHandler.Encrypt(aes);
            aes.Clear();
            liste.ItemsSource = elements;
        }

        private void ClearShowBoxes()
        {
            tBoxShow_title.Text = "";
            tBoxShow_link.Text = "";
            tBoxShow_id.Text = "";
            tBoxShow_mdp.Text = "";
            tBoxShow_com.Text = "";
        }

        private void EnableShowBox(bool b)
        {
            if (b)
                bt_modify.Content = "Valider";
            else
                bt_modify.Content = "Modifier";
            b = !b;
            tBoxShow_com.IsReadOnly = b;
            tBoxShow_id.IsReadOnly = b;
            tBoxShow_link.IsReadOnly = b;
            tBoxShow_mdp.IsReadOnly = b;
            tBoxShow_title.IsReadOnly = b;
        }

        private void ClearAddBoxes()
        {
            tBoxAdd_title.Text = "Titre";
            tBoxAdd_link.Text = "Lien";
            tBoxAdd_id.Text = "Identifiant";
            tBoxAdd_mdp.Text = "Mot de passe";
            tBoxAdd_com.Text = "Commentaire";

            SolidColorBrush foreground = new SolidColorBrush(Color.FromRgb(102, 102, 102));
            tBoxAdd_title.Foreground = foreground;
            tBoxAdd_link.Foreground = foreground;
            tBoxAdd_id.Foreground = foreground;
            tBoxAdd_mdp.Foreground = foreground;
            tBoxAdd_com.Foreground = foreground;
        }

        private void Unlock()
        {
            liste.Opacity = 1;
            connection_layout.Opacity = 0;

            ViewsStat(true);

            aes = Aes.Create();
            aes.Key = MainPassword.Hash(MainPass);
            elements = XmlHandler.GetElements(elements, aes);
            liste.ItemsSource = elements;
            aes.Clear();
        }

        private void Lock()
        {
            liste.Opacity = 0;
            connection_layout.Opacity = 1;

            ClearShowBoxes();
            EnableShowBox(false);

            ViewsStat(false);

            elements.Clear();
            MainPass = "";
        }

        private void ViewsStat(bool v)
        {
            bt_modify.IsEnabled = v;
            bt_suppr.IsEnabled = v;
            bt_id1.IsEnabled = v;
            bt_id2.IsEnabled = v;
            bt_addMdp.IsEnabled = v;
            bt_genMdp.IsEnabled = v;

            tBoxAdd_com.IsEnabled = v;
            tBoxAdd_id.IsEnabled = v;
            tBoxAdd_link.IsEnabled = v;
            tBoxAdd_mdp.IsEnabled = v;
            tBoxAdd_title.IsEnabled = v;

            tBoxAdd_search.IsEnabled = v;
            tBox_lenght.IsEnabled = v;

            checkB_ch.IsEnabled = v;
            checkB_maj.IsEnabled = v;
            checkB_min.IsEnabled = v;
            checkB_spe.IsEnabled = v;

            bt_settings.IsEnabled = v;

        }

        private void LoadIds()
        {
            if(File.Exists("ids.txt")){
                StreamReader reader = new StreamReader("ids.txt");
                id_user1 = reader.ReadLine();
                id_user2 = reader.ReadLine();
                reader.Close();
            }
            else
            {
                FileStream f = File.Create("ids.txt");
                f.Close();
            }
        }

        public void ClipText(string text)
        {
            Clipboard.SetText(text);
            AfficherMessageClip();
        }

        public void AfficherMessageClip()
        {
            timer.Dispose();
            timer = new Timer(5000);
            Tb_Message.BeginAnimation(MarginProperty, apparritionMessage);
            timer.Elapsed += EnleverMessageClip;
            timer.Enabled = true;
            timer.AutoReset = false;
            timer.Start();
        }
        private void EnleverMessageClip(Object source, ElapsedEventArgs e)
        {
            Dispatcher.Invoke(() =>
            {
                Tb_Message.BeginAnimation(MarginProperty, disparitionMessage);
            });
        }
    }

}
