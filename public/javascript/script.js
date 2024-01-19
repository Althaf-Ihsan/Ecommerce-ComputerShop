function addToCart(proId)
  {
    $.ajax({
      url:'/addTocart/'+proId,
      method:'get',
      success:(response)=>{
        if(response.status)
        {
            let count=$('#cartCount').html();
            count=parseInt(count)+1;
            $('#cartCount').html(count)
            location.reload();
        }
      }
  })
}

function deleteProductCart(cartId,proId)
{
    console.log("api called")
    $.ajax({
        url:'/deleteProduct',
        data:{
            cart:cartId,
            product:proId
        },
        method:'POST',
         success:(response)=>{
               if(response.removeProduct){
                alert("product removed from carttt")
               location.reload();
               }
         }       
    })
}
