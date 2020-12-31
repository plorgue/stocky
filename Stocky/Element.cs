using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Stocky
{
    public class Element : IComparable<Element>
    {
        public string Titre { get; set; }
        public string Lien { get; set; }
        public string Identifiant { get; set; }
        public string MotDePasse { get; set; }
        public string Commentaire { get; set; }

        public Element()
        {
            Titre = "";
            Lien = "";
            Identifiant = "";
            MotDePasse = "";
            Commentaire = "";
        }
        public Element(string titre, string lien, string identifaint, string motdepasse, string commentaire)
        {
            Titre = titre;
            Lien = lien;
            Identifiant = identifaint;
            MotDePasse = motdepasse;
            Commentaire = commentaire;
        }

        public override string ToString()
        {
            return new StringBuilder(Titre).Append(" "+Lien).Append(" "+Identifiant).Append(" "+MotDePasse).Append(" "+Commentaire).ToString();
        }

        public int CompareTo(Element other)
        {
            if (other == null)
                return 1;
            else
                return this.Titre.CompareTo(other.Titre);
        }
    }
}
