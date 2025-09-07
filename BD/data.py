import pandas as pd

class Data:
    @staticmethod
    def read_files():
        assets = pd.read_csv("tablas/Assets.csv")
        capital = pd.read_csv("tablas/Capital.csv")
        earnings = pd.read_csv("tablas/Earnings.csv")
        liquidicy = pd.read_csv("tablas/Liquidicy.csv")
        managerial = pd.read_csv("tablas/Managerial.csv")

        return capital, assets, managerial, earnings, liquidicy
    
    @staticmethod
    def create_camel(cursor, conn):
        cursor.execute("""
            INSERT IGNORE INTO camel (nombre)
            VALUES ('Capital'), ('Assets'), ('Earnings'), ('Liquidicy'), ('Managerial');
        """)
        conn.commit()
    
    @staticmethod
    def create_indicator(cursor, conn):        
        for i in range(5):
            camel = Data.read_files()[i]
            values_indicators = camel["índice CAMEL"].unique()
            for nombre in values_indicators:
                cursor.execute("""
                    INSERT IGNORE INTO indicador (ID_camel, nombre)
                    VALUES (%s, %s)
                """, (i+1, nombre))
            
        conn.commit()
    
    @staticmethod
    def create_cooperativas(cursor, conn):
        capital, *_ = Data.read_files() # a representative file for all the cooperatives

        coop_names = [name.strip() for name in capital.columns[3:].tolist()]
        coop_names = capital.columns[3:].tolist()

        # tuples for coop names
        params = [(name,) for name in coop_names]

        cursor.executemany(
            "INSERT IGNORE INTO cooperativa (nombre) VALUES (%s);",
            params
        )
        conn.commit()

    @staticmethod
    def create_registros(cursor, conn):
        files = Data.read_files() 

        cursor.execute("SELECT ID_indicador, nombre FROM indicador")
        ind_map = {name: iid for iid, name in cursor.fetchall()}

        cursor.execute("SELECT ID_cooperativa, nombre FROM cooperativa")
        coop_map = {name: cid for cid, name in cursor.fetchall()}

        inserts = []

        for df in files:
            coop_names = df.columns[3:].tolist()  # cooperative's columns

            for _, row in df.iterrows():
                indicador_nombre = row["índice CAMEL"]
                if indicador_nombre not in ind_map:
                    continue
                id_indicador = ind_map[indicador_nombre]

                ano = int(row["Año"])
                mes = int(row["Mes"])

                for coop in coop_names:
                    if coop not in coop_map:
                        continue
                    id_coop = coop_map[coop]
                    valor = row[coop]

                    if pd.isna(valor):
                        continue

                    inserts.append((id_indicador, id_coop, ano, mes, valor))

        cursor.executemany("""
            INSERT IGNORE INTO registro (ID_indicador, ID_cooperativa, ano, mes, valor)
            VALUES (%s, %s, %s, %s, %s);
        """, inserts)

        conn.commit()

