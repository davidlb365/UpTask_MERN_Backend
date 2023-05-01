import Usuario from "../models/Usuario.js"
import generarId from "../helpers/generarId.js"
import generarJWT from "../helpers/generarJWT.js"
import { emailRegistro, emailOlvidePassword } from "../helpers/email.js"

const registrar = async (req, res) => {
    // Evitar registros duplicados
    const {email} = req.body
    const existeUsuario = await Usuario.findOne({email})
    if(existeUsuario) {
        const error = new Error('Usuario ya registrado')
        return res.status(400).json({msg: error.message})
    }
    try {
        const usuario = new Usuario(req.body)
        usuario.token = generarId()
        await usuario.save()
        // Enviar el email de confirmacion
        emailRegistro({
            email: usuario.email,
            nombre: usuario.nombre,
            token: usuario.token
        })
        res.json({msg: 'Usuario Creado Correctamente, Revisa tu Email para confirmar tu cuenta'})
    } catch (error) {
        console.log(error)
    }
}

const autenticar = async (req, res) => {
    // res.json(req.body)
    const {email, password} = req.body
    // Comprobar si el usuario existe
    const usuario = await Usuario.findOne({email})
    if(!usuario) {
        const error = new Error('El Usuario no existe')
        return res.status(404).json({msg: error.message})
    }
    // Comprobar si el usuario está confirmado
    if(!usuario.confirmado) {
        const error = new Error('Tu Cuenta no ha sido confirmada')
        return res.status(403).json({msg: error.message})
    }
    if(!await usuario.comprobarPassword(password)) {
        const error = new Error('Password incorrecto')
        return res.status(403).json({msg: error.message})
    }
    res.json({
        _id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        token: generarJWT(usuario._id)
    })
}

const confirmar = async (req, res) => {
    const {token} = req.params
    const usuario = await Usuario.findOne({token})
    if(!usuario) {
        const error = new Error('El token no es válido')
        return res.status(403).json({msg: error.message})
    }
    try {
        usuario.confirmado = true
        usuario.token = ""
        await usuario.save()
        res.json({msg: "Usuario Confirmado Correctamente"})
    } catch (error) {
        console.log(error)
    }
}

const olvidePassword = async (req, res) => {
    const {email} = req.body
    const usuario = await Usuario.findOne({email})
    if(!usuario) {
        const error = new Error('El Usuario no existe')
        return res.status(404).json({msg: error.message})
    }
    try {
        usuario.token = generarId()
        await usuario.save()
        // Enviar email
        emailOlvidePassword({
            email: usuario.email,
            nombre: usuario.nombre,
            token: usuario.token
        })
        res.json({msg: "Hemos enviado un email con las instrucciones"})
    } catch (error) {
        console.log(error)
    }
}

const comprobarToken = async (req, res) => {
    const {token} = req.params
    const usuario = await Usuario.findOne({token})
    if(!usuario) {
        const error = new Error('El token no es válido')
        return res.status(404).json({msg: error.message})
    }
    res.json({msg: "Token válido y el usuario existe"})
}

const nuevoPassword = async(req, res) => {
    const {token} = req.params
    const {password} = req.body
    const usuario = await Usuario.findOne({token})
    if(!usuario) {
        const error = new Error('El token no es válido')
        return res.status(404).json({msg: error.message})
    }
    try {
        usuario.password = password
        usuario.token = ""
        await usuario.save()
        res.json({msg: "Password cambiado correctamente"})
    } catch (error) {
        console.log(error)
    }
}

const perfil = async (req, res) => {
    const {usuario} = req
    res.json(usuario)
}

export {
    registrar,
    autenticar,
    confirmar,
    olvidePassword,
    comprobarToken,
    nuevoPassword,
    perfil
}