import { getGradeInfo } from '@/app/lib/gpa'

interface not{
    id: number
}
export default function Notation({id}:not){
    const grade = getGradeInfo(id)
    
    return(<div>
        <div>{id} {grade.letter} {grade.status}</div>
    </div>
    )
}