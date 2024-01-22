const isLogin=async(req,res,next)=>{
    try {
      if (req.session.admin){
          next();
      }else{
        res.redirect('/admin/adminLogin')
      }
  
  
    } catch (error) {
      console.log(error.message)
    }
  }
  //------------------------------------------------------------------------------------------
  const isLogout = async (req, res, next) => {
  try {
      if (req.session.admin) {
          res.redirect('/admin/');
      } else {
          next();
      }
  } catch (error) {
      console.log(error.message);
  }
  }
  
  module.exports={
  isLogin,
  isLogout
  }