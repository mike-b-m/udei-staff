import { useState,useEffect } from "react"

interface not{
    id: number
}
export default function Notation({id}:not){
    const [lett,setLett] = useState('')
    const [note,setNote] = useState('')
    const [pass,setPass]= useState('')

    useEffect(() => {
                const getData = async () => {
                  if (id <= 100 || id >= 90)
    {
        setLett('A')
        setNote('Excellent')
    }
    if (id <=89 || id >= 80)
    {
        setLett('B')
        setNote('Très Bien')
    }
    if (id <= 79 || id >= 65)
    {
        setLett('C')
        setNote('Bien')
    }
    if (id<= 64 || id >= 50)
        {
            setLett('D')
        setPass('Reprise')
        }
    if (id <= 49 || id >= 0)
    {
        setLett('E')
        setPass('Echec')
    }
    if (id <= 100 || id >= 65)
    {
        setLett('R')
        setPass('Réussite')
    }
                  ;}
                   getData()},[id])
    
    
    return(<div>
        <div>{id}
            {lett}
            {pass}
        </div>
    </div>

    )

}