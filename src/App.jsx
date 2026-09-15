import { useState, useEffect } from "react"
import { supabase } from "./supabaseClient"
import "./App.css"

function App() {
  // State
  const [oraUscita, setOraUscita] = useState(null)
  const [listaTurni, setListaTurni] = useState([])
  const [mostraForm, setMostraForm] = useState(false)
  const [inputEntrata, setInputEntrata] = useState("")
  const [inputUscita, setInputUscita] = useState("")
  const [messaggioSalvato, setMessaggioSalvato] = useState(false)
  const [oraEntrata, setOraEntrata] = useState(() => {
    const salvato = localStorage.getItem('oraEntrata')
    return salvato ? new Date(salvato) : null
  })


  let minutiTotali = 0


  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }
  }, []);

  // Calcolo minuti totali
  if (oraEntrata && oraUscita) {
    minutiTotali = (oraUscita - oraEntrata) / (1000 * 60)
  }

  // Se cliccato bottone termina vengono inseriti i dati nel database
  async function terminaTurno() {
    const uscita = new Date();
    setOraUscita(uscita)
    localStorage.removeItem('oraEntrata')

    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready
      const notifiche = await registration.getNotifications({ tag: "turno-attivo" })
      notifiche.forEach(n => n.close())
    }

    const minuti = (uscita - oraEntrata) / (1000 * 60)

    const { data, error } = await supabase
      .from("turni") // nella tabella turni
      .insert({ // inserisci i seguenti dati
        entrata: oraEntrata,
        uscita: uscita,
        minuti_totali: Math.floor(minuti)
      })
      .select()

    if (error) {
      console.error("Errore:", error)
      return
    }

    console.log("Turno salvato:", data)
  }


  // Se cliccato bottone lista vengono presi e ordinati i dati dal più recente al meno recente
  async function prendiOrdina() {
    const { data, error } = await supabase
      .from("turni")
      .select("id, entrata, uscita, minuti_totali")
      .order("entrata", { ascending: false });

    if (error) {
      console.log("Errore:", error);
      return;
    }

    setListaTurni(data);
  }

  async function chiediPermessoNotifiche() {
    if (Notification.permission === "default") {
      await Notification.requestPermission();
    }
  }

  // Bottone inizia turno e notifica
  async function iniziaTurno() {
    const ora = new Date()
    setOraEntrata(ora)
    localStorage.setItem('oraEntrata', ora.toISOString())

    await chiediPermessoNotifiche()

    if (Notification.permission === "granted") {
      const registration = await navigator.serviceWorker.ready

      registration.showNotification("Turno in corso", {
        body: `Iniziato alle ${ora.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`,
        tag: "turno-attivo",
        requireInteraction: true,
        silent: true
      })
    }
  }


  // Se cliccato il bottone inserisci manualmente, vengono inseriti nel database i dati forniti dall'utente
  async function salvaManuale() {
    const uscita = new Date(inputUscita);
    const entrata = new Date(inputEntrata);

    const minuti = (uscita - entrata) / (1000 * 60)


    const { data, error } = await supabase
      .from("turni")
      .insert({
        entrata: entrata,
        uscita: uscita,
        minuti_totali: Math.floor(minuti)
      })
      .select()


    // Messaggio di salvataggio avvenuto con successo
    setMessaggioSalvato(true);
    setTimeout(() => {
      setMessaggioSalvato(false);
    }, 2000)

    if (error) {
      console.error("Errore:", error)
      return
    }

    console.log("Turno salvato:", data)
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">Timely</h1>
        <p className="app__subtitle">registro ore di lavoro</p>
      </header>

      {(oraEntrata || oraUscita) && (
        <section className={`stato ${oraEntrata && !oraUscita ? 'stato--attivo' : ''} ${oraUscita ? 'stato--chiuso' : ''}`}>
          {oraEntrata && (
            <div className="stato__riga">
              <span>Entrata</span>
              <span className="stato__valore">
                {oraEntrata.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', hour12: false })}
              </span>
            </div>
          )}

          {oraUscita && (
            <div className="stato__riga">
              <span>Uscita</span>
              <span className="stato__valore">
                {oraUscita.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', hour12: false })}
              </span>
            </div>
          )}

          {oraEntrata && oraUscita && (
            <div className="stato__totale">
              <span>Totale</span>
              <span className="stato__totale-valore">
                {Math.floor(minutiTotali / 60)}h {Math.floor(minutiTotali % 60)}m
              </span>
            </div>
          )}
        </section>
      )}

      <div className="azioni">
        {!oraEntrata ? (
          <button className="btn-inizia" onClick={iniziaTurno}>
            ▶ Inizia turno
          </button>
        ) : !oraUscita ? (
          <button className="btn-termina" onClick={terminaTurno}>
            ⏹ Termina turno
          </button>
        ) : (
          <button className="btn-inizia" onClick={() => { setOraEntrata(new Date()); setOraUscita(null) }}>
            ▶ Inizia turno
          </button>
        )}

        <button className="btn-secondario" onClick={() => setMostraForm(true)}>
          Inserisci manualmente
        </button>
      </div>

      {mostraForm && (
        <div className="form-manuale">
          <div className="campo">
            <label htmlFor="entrataInput">Entrata</label>
            <input
              id="entrataInput"
              type="datetime-local"
              value={inputEntrata}
              onChange={(e) => setInputEntrata(e.target.value)}
            />
          </div>

          <div className="campo">
            <label htmlFor="uscitaInput">Uscita</label>
            <input
              id="uscitaInput"
              type="datetime-local"
              value={inputUscita}
              onChange={(e) => setInputUscita(e.target.value)}
            />
          </div>

          <button className="btn-salva" onClick={() => { salvaManuale(); setMostraForm(false) }}>
            Salva
          </button>
        </div>
      )}

      {messaggioSalvato && (
        <div className="toast">Turno salvato con successo!</div>
      )}

      <button className="btn-lista" onClick={() => prendiOrdina()}>
        Lista turni
      </button>

      <div className="lista">
        {listaTurni.map((turno, index) => {
          const entrata = new Date(turno.entrata);
          const uscita = new Date(turno.uscita);

          const meseAttuale = entrata.toLocaleDateString('it-IT', {
            month: 'long',
            year: 'numeric'
          });

          let mesePrecedente = null;
          if (index > 0) {
            mesePrecedente = new Date(listaTurni[index - 1].entrata).toLocaleDateString('it-IT', {
              month: 'long',
              year: 'numeric'
            });
          }

          return (
            <div key={turno.id}>
              {(index === 0 || meseAttuale !== mesePrecedente) && (
                <h2 className="lista__mese">{meseAttuale}</h2>
              )}
              <div className="turno">
                <span className="turno__data">
                  {entrata.toLocaleDateString('it-IT')}
                </span>
                <span className="turno__orari">
                  {entrata.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', hour12: false })}
                  {' → '}
                  {uscita.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', hour12: false })}
                </span>
                <span className="turno__totale">
                  {Math.floor(turno.minuti_totali / 60)}h {turno.minuti_totali % 60}m
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default App