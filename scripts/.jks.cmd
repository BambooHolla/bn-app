keytool -genkey -v -alias slserver -keyalg RSA -keysize 1024 -keypass 111111 -dname "cn=Gaubee,ou=厦门本能管家科技有 限公司,o=Ifmchain项目组,
l=厦门,st=福建,c=中华人民共和国" -keystore .\ifm-app-v2.jks -storepass 111111 -validity 3650

keytool -importkeystore -srckeystore .\ifm-app-v2.jks -destkeystore .\ifm-app-v2.jks -deststoretype pkcs12