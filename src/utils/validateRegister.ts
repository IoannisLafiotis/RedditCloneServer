import { UsernamePasswordInput } from "src/resolvers/UsernamePasswordInput"

export const validateRegister = (options: UsernamePasswordInput ) => {
    if(!options.email.includes("@")){
        return [
                {
                field: "email",
                message: "That email is invalid!"
            }
        ]
        
    }

    if(options.username.length < 2){
        return [
                {
                field: "username",
                message: "That username lenght is inadequate!"
            }]
        
    }
    if(options.username.includes("@")){
        return [
                {
                field: "username",
                message: "That username cannot include an @ sign!"
            }]
        
    }


    if(options.password.length < 2){
        return [
                {
                field: "password",
                message: "That password lenght is inadequate!"
            }]
        
    }
    return null;
    }