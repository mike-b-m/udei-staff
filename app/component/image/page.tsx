'use client'
import {supabase} from "../db";
export default function UploadImage(){
    const uploadPage = async (e:React.ChangeEvent<HTMLInputElement>)=>{
        const file = e.target.value?.[0]
        if (!file) return

    //    const fileNameParts = file.name ? file.name.split('.') : []
 // const fileExt = fileNameParts.length > 1 ? fileNameParts.pop() : 'png' 
        const fileExt = file.name?.split('.')
        const fileName = `${crypto.randomUUID()}.${fileExt}`
        const filePath =  `image/${fileName}`
    
        const reader = new FileReader()
  reader.readAsArrayBuffer(file)
  
  reader.onload = async () => {
    const arrayBuffer = reader.result as ArrayBuffer

      const { error: uploadError } = await supabase.storage
      .from('udei_package')
      .upload(filePath, arrayBuffer, {
    contentType: 'image/jpg', // IMPORTANT
upsert: false})
       if (uploadError) {
      console.error(uploadError)
      return
    }
    //  Get public URL
    const { data } = supabase.storage
      .from('uploads')
      .getPublicUrl(filePath)

    const imageUrl = data.publicUrl

      // Store URL in database
    const { error: dbError } = await supabase
      .from('image')
      .insert({ profil_url: imageUrl })
  //.eq('last_name', 'michel')

    if (dbError) {
      console.error(dbError.message)
    } else {
      console.log('Image saved successfully')
    }}

    } 
    return(
        <div>
            return <input className='bg-gray-200' type="file" accept="image/*" onChange={uploadPage} />
        </div>
    )
}