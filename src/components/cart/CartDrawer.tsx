import { useCart } from "@/contexts/CartContext";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import { toBrandedUrl } from "@/lib/imageUtils";

const CartDrawer = () => {
  const { items, isOpen, closeCart, removeItem, updateQuantity, totalItems, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    closeCart();
    navigate("/checkout");
  };

  const handleShop = () => {
    closeCart();
    navigate("/shop");
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent className="flex flex-col w-full sm:max-w-md z-[60]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            Cart ({totalItems})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
            <ShoppingBag className="w-16 h-16 text-muted-foreground/30" />
            <div>
              <p className="font-medium text-foreground">Your cart is empty</p>
              <p className="text-sm text-muted-foreground mt-1">Browse our products and add items to get started.</p>
            </div>
            <Button onClick={handleShop} className="gap-2">
              Start Shopping <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-3 py-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 p-3 rounded-lg border border-border bg-background">
                  {item.image_url && (
                    <img src={toBrandedUrl(item.image_url)} alt={item.title} className="w-16 h-16 rounded-md object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                    <p className="text-sm font-semibold text-primary mt-1">
                      ${(item.sale_price ?? item.price).toFixed(2)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-7 h-7 rounded-md border border-border flex items-center justify-center hover:bg-accent text-muted-foreground"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 rounded-md border border-border flex items-center justify-center hover:bg-accent text-muted-foreground"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="ml-auto text-destructive hover:text-destructive/80 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold text-foreground">${totalPrice.toFixed(2)}</span>
              </div>
              <Button onClick={handleCheckout} className="w-full gap-2">
                Proceed to Checkout <ArrowRight className="w-4 h-4" />
              </Button>
              <Button onClick={clearCart} variant="ghost" size="sm" className="w-full text-muted-foreground">
                Clear Cart
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
