import React, { useState } from "react";

function FormularioCamel() {
  const [indicador1, setIndicador1] = useState("");
  const [indicador2, setIndicador2] = useState("");
  const [resultado, setResultado] = useState(null);

  const enviarDatos = async () => {
    const body = {
      indicador1: parseFloat(indicador1),
      indicador2: parseFloat(indicador2),
    };

    try {
      const res = await fetch("http://localhost:8000/camel/calcular", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      setResultado(data.resultado);
    } catch (error) {
      console.error("Error al enviar datos:", error);
    }
  };

  return (
    <div>
      <h2>Ingreso de Indicadores CAMEL</h2>
      <input
        type="number"
        value={indicador1}
        onChange={(e) => setIndicador1(e.target.value)}
        placeholder="Indicador 1"
      />
      <input
        type="number"
        value={indicador2}
        onChange={(e) => setIndicador2(e.target.value)}
        placeholder="Indicador 2"
      />
      <button onClick={enviarDatos}>Calcular</button>

      {resultado !== null && (
        <p>Resultado del cálculo: <strong>{resultado}</strong></p>
      )}
    </div>
  );
}

export default FormularioCamel;

