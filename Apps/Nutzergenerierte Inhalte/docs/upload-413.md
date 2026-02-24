# 413 – Datei zu groß für den Server

Die Meldung **„Datei zu groß für den Server (413)“** kommt vom **Webserver** (Apache oder nginx), nicht von PHP. Der Webserver begrenzt die Größe des HTTP-Request-Bodens und lehnt größere Uploads ab, bevor PHP sie überhaupt sieht.

**Warum funktionieren manuell kopierte Dateien?**  
Beim Kopieren per FTP/SSH/Dateimanager geht die Datei direkt auf den Server – der Webserver ist nicht beteiligt. Beim Upload im Browser läuft die Datei als HTTP-Request durch den Webserver, der dann 413 zurückgibt.

---

## Lösung: Upload-Limit im Webserver erhöhen

### Apache

**Variante 1: .htaccess** (wenn erlaubt)

Im Ordner `api/` liegt bereits eine `.htaccess` mit:

```apache
php_value upload_max_filesize 100M
php_value post_max_size 100M
```

Falls du **413** trotzdem bekommst, setzt Apache oft noch **LimitRequestBody**. Dann in der **VirtualHost-** oder **.htaccess**-Konfiguration (eine Ebene über `api/`, z. B. im Webroot) ergänzen:

```apache
LimitRequestBody 104857600
```

(104857600 = 100 MB in Bytes)

**Variante 2: php.ini** (für upload_max_filesize / post_max_size)

```ini
upload_max_filesize = 100M
post_max_size = 100M
```

**Variante 3: Apache-Modul LimitRequestBody**

In der VirtualHost-Konfiguration oder in einer zentralen Config:

```apache
LimitRequestBody 104857600
```

Danach Apache neu starten bzw. Konfiguration neu laden.

---

### nginx

nginx ignoriert .htaccess und PHP-Einstellungen für die Request-Größe. Du musst **client_max_body_size** setzen, z. B. in der `server`- oder `location`-Konfiguration:

```nginx
client_max_body_size 100M;
```

Beispiel in einem `server`-Block:

```nginx
server {
    # ...
    client_max_body_size 100M;
    # ...
}
```

Danach nginx neu laden:

```bash
nginx -t && systemctl reload nginx
```

---

### Kurzfassung

| Umgebung | Einstellung |
|----------|-------------|
| **Apache** | `LimitRequestBody 104857600` (und ggf. php.ini: upload_max_filesize / post_max_size) |
| **nginx** | `client_max_body_size 100M;` |
| **PHP** | upload_max_filesize, post_max_size (z. B. in .htaccess oder php.ini) |

Nach der Anpassung den Upload im Browser erneut testen.
