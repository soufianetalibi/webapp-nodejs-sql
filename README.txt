
Application backend avec node.js ayant une page index.html qui contient un formulaire de contact.

le backend permet de stocker les donn�es dans une base azure SQL server
la route / du backend appelle la page index.html
 
 Base de donn�es azure SQL : 

SERVEUR=monserveursql.database.windows.net
DATABASE=SQLDB
USER=soufiane
PASSWORD=yourpassword

Table � cr�er : ===============================

-- Supprimer la table si elle existe
IF OBJECT_ID('dbo.contact', 'U') IS NOT NULL
    DROP TABLE dbo.contact;
GO

-- Cr�er la table contact
CREATE TABLE dbo.contact (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nom NVARCHAR(100) NOT NULL,
    email NVARCHAR(100) NOT NULL,
    telephone NVARCHAR(50) NULL,
    message NVARCHAR(MAX) NULL, -- Permet d'enregistrer des messages longs
    date_creation DATETIME2 DEFAULT SYSDATETIME()
);
GO


===
d�marrer en local le backend : node server.js

Acc�der au lien : http://localhost:3000, le backend appelle la page public/index.html

l'API est accessible via : 

 GET http://localhost:3000/api/formulaires  -> l'API effectue un select et affiche le r�sultat sous format JSON 

 POST http://localhost:3000/api/formulaires -> l'API permet d'ajouter une ligne dans la BD.
                  exemple :    curl -X POST http://localhost:3000/api/formulaires -H "Content-Type: application/json" -d "{\"nom\":\"Soufiane\",\"email\":\"soufiane@example.com\",\"telephone\":\"0600000000\",\"message\":\"Ceci est un test\"}"

 DELETE http://localhost:3000/api/formulaires/:id -> l'API permet de supprimer une ligne dans la BD.

====> il est possible de d�ployer cette webapp sur azure app service via github : 

.env : contient les informations de connexion � la base de donn�es pour tester en local
node_modules : dossiers g�n�r� automatiquement lors de l'execution de la webapp en local 
le fichier .gitignore permet d'exclure ".env" et "node_modules" lors du transfert vers github



az login
az group create --name webapp-node-js --location francecentral

transf�rer le contenu du dossier (ne pas inclure le fichier .env et le dossier node_modules) : 

git init
git add .
git commit -m "Initial commit"

az webapp create --resource-group webapp-node-js --plan MonPlanApp --name MonAppNode --runtime "NODE:22-lts"

az webapp deployment source config-local-git --name MonAppNode --resource-group webapp-node-js

Ceci va g�n�rer : 

git remote add azure

git push azure main

Dans Azure Portal ? Ton WebApp ? Configuration ? Param�tres d�application :
 DB_USER
 DB_PASSWORD
 DB_SERVER
 DB_DATABASE
 DB_ENCRYPT
 DB_TRUST_CERTIFICATE
   --> cela remplace le fichier .env en local

v�rifier : az webapp browse --name MonAppNode --resource-group webapp-node-js

tester : https://MonAppNode.azurewebsites.net





==============
cr�er une webapp Node.js sur azure :
  az group create --name Testwebapp --location francecentral 
  az appservice plan create --name TestPlanApp1 --resource-group Testwebapp --sku B1 --is-linux
  az webapp create --resource-group Testwebapp --plan TestPlanApp1 --name TestAppNodejs --runtime "NODE:22-lts"

cr�er une webapp Flask sur azure :
  az group create --name Testwebapp --location francecentral 
  az appservice plan create --name TestPlanApp2 --resource-group Testwebapp --sku B1 --is-linux
  az webapp create --resource-group Testwebapp --plan TestPlanApp2 --name TestAppFlask --runtime "PYTHON:3.13"
